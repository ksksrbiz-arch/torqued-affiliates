// Copyright (c) 2025 Keith John Skaggs Jr. All rights reserved.
// This software is proprietary, copywritten, and strictly licensed. Unauthorized use is prohibited and will be prosecuted.
import { Pool } from 'pg';

const dbType = process.env.DATABASE_TYPE || 'memory';

// Basic in-memory stores for tests and quick dev
const memoryShops = new Map<string, any>();
const memoryStates = new Map<string, string>();

async function getPgPool(): Promise<Pool> {
  const { Pool } = await import('pg');
  return new Pool({ connectionString: process.env.DATABASE_URL });
}

import crypto from 'crypto';

function encryptData(plain: string) {
  const key = crypto.createHash('sha256').update(process.env.APP_SECRET || 'dev-secret').digest();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString('base64');
}

function decryptData(blob: string) {
  try {
    const key = crypto.createHash('sha256').update(process.env.APP_SECRET || 'dev-secret').digest();
    const b = Buffer.from(blob, 'base64');
    const iv = b.slice(0, 12);
    const tag = b.slice(12, 28);
    const encrypted = b.slice(28);
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);
    const out = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return out.toString('utf8');
  } catch (e) {
    return null;
  }
}

const tokenStore = {
  async saveShopToken(shop: string, token: any) {
    if (dbType === 'postgres') {
      const pool = await getPgPool();
      const toStore = token.access_token ? (process.env.APP_SECRET ? encryptData(JSON.stringify(token)) : JSON.stringify(token)) : (process.env.APP_SECRET ? encryptData(token) : token);
      await pool.query(
        `INSERT INTO shops (shop, access_token, scopes, updated_at)
         VALUES ($1, $2, $3, now())
         ON CONFLICT (shop) DO UPDATE SET access_token = EXCLUDED.access_token, scopes = EXCLUDED.scopes, updated_at=now()`,
        [shop, toStore, token.scopes || '']
      );
      await pool.end();
      return;
    }

    if (dbType === 'mongo') {
      const mongoose = await import('mongoose');
      const schema = new mongoose.Schema({ shop: String, access_token: String, scopes: String }, { timestamps: true });
      const Model = mongoose.models.Shop || mongoose.model('Shop', schema);
      const toStore = token.access_token ? (process.env.APP_SECRET ? encryptData(JSON.stringify(token)) : JSON.stringify(token)) : (process.env.APP_SECRET ? encryptData(token) : token);
      await Model.findOneAndUpdate({ shop }, { shop, access_token: toStore, scopes: token.scopes || '' }, { upsert: true, new: true });
      return;
    }

    // memory
    memoryShops.set(shop, token);
  },

  async getShopToken(shop: string) {
    if (dbType === 'postgres') {
      const pool = await getPgPool();
      const res = await pool.query('SELECT access_token, scopes FROM shops WHERE shop=$1 LIMIT 1', [shop]);
      await pool.end();
      if (res.rowCount === 0) return null;
      const raw = res.rows[0].access_token;
      const decoded = process.env.APP_SECRET ? decryptData(raw) : raw;
      try {
        const parsed = typeof decoded === 'string' ? JSON.parse(decoded) : decoded;
        return { access_token: parsed.access_token || parsed, scopes: res.rows[0].scopes };
      } catch {
        return { access_token: decoded, scopes: res.rows[0].scopes };
      }
    }

    if (dbType === 'mongo') {
      const mongoose = await import('mongoose');
      const schema = new mongoose.Schema({ shop: String, access_token: String, scopes: String }, { timestamps: true });
      const Model = mongoose.models.Shop || mongoose.model('Shop', schema);
      const doc: any = await Model.findOne({ shop }).lean();
      if (!doc) return null;
      const raw = doc.access_token;
      const decoded = process.env.APP_SECRET ? decryptData(raw) : raw;
      try {
        const parsed = typeof decoded === 'string' ? JSON.parse(decoded) : decoded;
        return { access_token: parsed.access_token || parsed, scopes: doc.scopes };
      } catch {
        return { access_token: decoded, scopes: doc.scopes };
      }
    }

    return memoryShops.get(shop) ?? null;
  },

  async saveState(state: string, shop?: string) {
    if (dbType === 'postgres') {
      const pool = await getPgPool();
      await pool.query('INSERT INTO oauth_states (state, shop) VALUES ($1, $2) ON CONFLICT (state) DO NOTHING', [state, shop || null]);
      await pool.end();
      return;
    }

    if (dbType === 'mongo') {
      const mongoose = await import('mongoose');
      const schema = new mongoose.Schema({ state: String, shop: String }, { timestamps: true });
      const Model = mongoose.models.OAuthState || mongoose.model('OAuthState', schema);
      await Model.create({ state, shop });
      return;
    }

    memoryStates.set(state, shop ?? '');
  },

  async consumeState(state: string) {
    if (dbType === 'postgres') {
      const pool = await getPgPool();
      const res = await pool.query('DELETE FROM oauth_states WHERE state=$1 RETURNING shop', [state]);
      await pool.end();
      if (res.rowCount === 0) return null;
      return res.rows[0].shop;
    }

    if (dbType === 'mongo') {
      const mongoose = await import('mongoose');
      const schema = new mongoose.Schema({ state: String, shop: String }, { timestamps: true });
      const Model = mongoose.models.OAuthState || mongoose.model('OAuthState', schema);
      const doc = await Model.findOneAndDelete({ state }).lean();
      return doc ? doc.shop : null;
    }

    const shop = memoryStates.get(state) ?? null;
    memoryStates.delete(state);
    return shop;
  }
};

export default tokenStore;
