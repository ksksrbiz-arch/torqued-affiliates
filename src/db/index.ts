// Copyright (c) 2025 Keith John Skaggs Jr. All rights reserved.
// This software is proprietary, copywritten, and strictly licensed. Unauthorized use is prohibited and will be prosecuted.
import { config } from '../config';

export type DbClient = {
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
};

// Factory for DB client depending on DATABASE_TYPE
export async function createDbClient(): Promise<DbClient> {
  const type = config.DATABASE_TYPE;
  if (type === 'postgres') {
    const { Pool } = await import('pg');
    const pool = new Pool({ connectionString: config.DATABASE_URL });

    // Ensure table exists — minimal schema
    await pool.query(`
      CREATE TABLE IF NOT EXISTS shops (
        id SERIAL PRIMARY KEY,
        shop VARCHAR(255) UNIQUE NOT NULL,
        access_token TEXT NOT NULL,
        scopes TEXT,
        created_at TIMESTAMP DEFAULT now(),
        updated_at TIMESTAMP DEFAULT now()
      );
      CREATE TABLE IF NOT EXISTS oauth_states (
        id SERIAL PRIMARY KEY,
        state VARCHAR(255) UNIQUE NOT NULL,
        shop VARCHAR(255),
        created_at TIMESTAMP DEFAULT now()
      );
      CREATE TABLE IF NOT EXISTS affiliates (
        id SERIAL PRIMARY KEY,
        affiliate_id VARCHAR(255) UNIQUE NOT NULL,
        data JSONB,
        created_at TIMESTAMP DEFAULT now()
      );
    `);

    return {
      connect: async () => {
        // the pool connects on demand
        await pool.connect().then((c: any) => c.release());
      },
      disconnect: async () => {
        await pool.end();
      }
    };
  } else if (type === 'mongo') {
    const mongoose = await import('mongoose');
    await mongoose.connect(config.DATABASE_URL, { dbName: config.MONGO_DB });
    return {
      connect: async () => Promise.resolve(),
      disconnect: async () => mongoose.disconnect()
    };
  }

  // memory (default): no-op
  return {
    connect: async () => Promise.resolve(),
    disconnect: async () => Promise.resolve()
  };
}
