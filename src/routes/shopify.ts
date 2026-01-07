// Copyright (c) 2025 Keith John Skaggs Jr. All rights reserved.
// This software is proprietary, copywritten, and strictly licensed. Unauthorized use is prohibited and will be prosecuted.
import { FastifyPluginAsync } from 'fastify';
import crypto from 'crypto';
import tokenStore from '../services/tokenStore';
import { verifyAppProxySignature, verifyOAuthCallbackHmac } from '../services/shopifyService';

const shopifyRoutes: FastifyPluginAsync = async (fastify) => {
  // OAuth state is persisted in tokenStore so it can survive process restarts and be validated on callback

  // App Proxy — Shopify will call this route (configured in the App Proxy setting)
  // The proxy request contains query params and a signature to verify. Return HTML or JSON.
  fastify.get(
    '/proxy',
    {
      schema: {
        querystring: {
          type: 'object',
          properties: {
            shop: { type: 'string' },
            path: { type: 'string' }
          },
          additionalProperties: true
        },
        response: {
          200: { type: 'string' },
          401: { type: 'string' }
        }
      }
    },
    async (request, reply) => {
      const secret = process.env.SHOPIFY_API_SECRET || '';
      if (!secret || !verifyAppProxySignature(request.query as Record<string, string>, secret)) {
        reply.code(401).send('invalid app-proxy signature');
        return;
      }

      // Example: return some affiliate UI snippet or JSON the store page can embed.
      const query = request.query as { shop?: string; path?: string };
      const shop = query.shop || 'unknown-shop';
      const path = query.path || '/';
      const html = `<div>Torqued Affiliates App Proxy — shop: ${shop} path: ${path}</div>`;
      reply.header('Content-Type', 'text/html');
      reply.code(200).send(html);
    }
  );

  // OAuth: redirect store owner to install page
  fastify.get(
    '/install',
    {
      schema: {
        querystring: {
          type: 'object',
          required: ['shop'],
          properties: {
            shop: { type: 'string', minLength: 1 }
          }
        },
        response: {
          302: { type: 'null' },
          400: { type: 'string' }
        }
      }
    },
    async (request, reply) => {
      const { shop } = request.query as { shop: string };

      const clientId = process.env.SHOPIFY_API_KEY || '';
      const scopes = process.env.SHOPIFY_SCOPES || 'read_products,read_orders';
      const redirectUri = process.env.SHOPIFY_REDIRECT_URI || 'https://your-backend.example.com/shopify/callback';
      const state = crypto.randomBytes(16).toString('hex');
      await tokenStore.saveState(state, shop);

      const installUrl = `https://${shop}/admin/oauth/authorize?client_id=${encodeURIComponent(clientId)}&scope=${encodeURIComponent(scopes)}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${encodeURIComponent(state)}`;
      reply.redirect(installUrl);
    }
  );

  // OAuth callback: validate state and optional HMAC then exchange code for a token
  fastify.get(
    '/callback',
    {
      schema: {
        querystring: {
          type: 'object',
          required: ['shop', 'code', 'state'],
          properties: {
            shop: { type: 'string', minLength: 1 },
            code: { type: 'string', minLength: 1 },
            state: { type: 'string', minLength: 1 },
            hmac: { type: 'string' }
          },
          additionalProperties: true
        },
        response: {
          200: { type: 'object', additionalProperties: true },
          400: { type: 'string' },
          500: { type: 'string' }
        }
      }
    },
    async (request, reply) => {
      try {
        const { shop, code, state } = request.query as {
          shop: string;
          code: string;
          state: string;
          hmac?: string;
        };

        const expectedShop = await tokenStore.consumeState(state);
        if (!expectedShop) {
          reply.code(400).send('invalid or expired state');
          return;
        }
        if (expectedShop !== shop) {
          reply.code(400).send('state shop mismatch');
          return;
        }

        // Verify HMAC from callback to ensure request is from Shopify
        const secret = process.env.SHOPIFY_API_SECRET || '';
        if (!verifyOAuthCallbackHmac(request.query as Record<string, string>, secret)) {
          request.log.warn('OAuth callback hmac validation failed');
          reply.code(400).send('invalid hmac');
          return;
        }
        // Exchange code for access token
        const clientId = process.env.SHOPIFY_API_KEY || '';
        const clientSecret = process.env.SHOPIFY_API_SECRET || '';

        const tokenUrl = `https://${shop}/admin/oauth/access_token`;
        const body = { client_id: clientId, client_secret: clientSecret, code };

        const resp = await (globalThis as typeof globalThis & { fetch: typeof fetch }).fetch(tokenUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });

        const json = await resp.json();
        // json.access_token contains the store token

        // Persist token securely associated with shop
        await tokenStore.saveShopToken(shop, json || { access_token: (json as { access_token?: string }).access_token });
        reply.code(200).send({ ok: true, shop, token: json });
      } catch (err) {
        request.log.error({ err }, 'OAuth callback error');
        reply.code(500).send('error');
      }
    }
  );
};

export default shopifyRoutes;
