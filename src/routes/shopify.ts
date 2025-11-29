import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import tokenStore from '../services/tokenStore';
import { verifyAppProxySignature, verifyOAuthCallbackHmac } from '../services/shopifyService';

const router = Router();

// OAuth state is persisted in tokenStore so it can survive process restarts and be validated on callback

// App Proxy — Shopify will call this route (configured in the App Proxy setting)
// The proxy request contains query params and a signature to verify. Return HTML or JSON.
router.get('/proxy', (req: Request, res: Response) => {
  const secret = process.env.SHOPIFY_API_SECRET || '';
  if (!secret || !verifyAppProxySignature(req.query as any, secret)) {
    return res.status(401).send('invalid app-proxy signature');
  }

  // Example: return some affiliate UI snippet or JSON the store page can embed.
  const shop = (req.query.shop as string) || 'unknown-shop';
  const path = (req.query.path as string) || '/';
  const html = `<div>Torqued Affiliates App Proxy — shop: ${shop} path: ${path}</div>`;
  res.setHeader('Content-Type', 'text/html');
  res.status(200).send(html);
});

// OAuth: redirect store owner to install page
router.get('/install', (req: Request, res: Response) => {
  const shop = req.query.shop as string | undefined;
  if (!shop) return res.status(400).send('shop query param required');

  const clientId = process.env.SHOPIFY_API_KEY || '';
  const scopes = process.env.SHOPIFY_SCOPES || 'read_products,read_orders';
  const redirectUri = process.env.SHOPIFY_REDIRECT_URI || 'https://your-backend.example.com/shopify/callback';
  const state = crypto.randomBytes(16).toString('hex');
  await tokenStore.saveState(state, shop);

  const installUrl = `https://${shop}/admin/oauth/authorize?client_id=${encodeURIComponent(clientId)}&scope=${encodeURIComponent(scopes)}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${encodeURIComponent(state)}`;
  res.redirect(installUrl);
});

// OAuth callback: validate state and optional HMAC then exchange code for a token
router.get('/callback', async (req: Request, res: Response) => {
  try {
    const { shop, code, state, hmac } = req.query as any;
    if (!state) return res.status(400).send('missing state');
    const expectedShop = await tokenStore.consumeState(state as string);
    if (!expectedShop) return res.status(400).send('invalid or expired state');
    if (expectedShop !== shop) return res.status(400).send('state shop mismatch');

    // Verify HMAC from callback to ensure request is from Shopify
    const secret = process.env.SHOPIFY_API_SECRET || '';
    if (!verifyOAuthCallbackHmac(req.query as any, secret)) {
      console.warn('OAuth callback hmac validation failed');
      return res.status(400).send('invalid hmac');
    }
    // Exchange code for access token
    const clientId = process.env.SHOPIFY_API_KEY || '';
    const clientSecret = process.env.SHOPIFY_API_SECRET || '';

    const tokenUrl = `https://${shop}/admin/oauth/access_token`;
    const body = { client_id: clientId, client_secret: clientSecret, code };

    const resp = await (globalThis as any).fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const json = await resp.json();
    // json.access_token contains the store token

    // Persist token securely associated with shop
    await tokenStore.saveShopToken(shop as string, json || { access_token: json.access_token });
    res.status(200).json({ ok: true, shop, token: json });
  } catch (err) {
    console.error('OAuth callback error', err);
    res.status(500).send('error');
  }
});

export default router;
