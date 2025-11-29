// Copyright (c) 2025 Keith John Skaggs Jr. All rights reserved.
// This software is proprietary, copywritten, and strictly licensed. Unauthorized use is prohibited and will be prosecuted.
import { Router, Request } from 'express';
import { verifyShopifyWebhook, getWebhookTopic } from '../services/shopifyService';

const router = Router();

// NOTE: For proper HMAC verification you must read the raw request body bytes.
// In production configure Express to expose raw body (see body-parser raw) or verify using middleware that
// preserves the raw bytes.
router.post('/shopify', (req: Request, res) => {
  try {
    // Header set by Shopify
    const hmac = req.headers['x-shopify-hmac-sha256'] as string | undefined;
    // For local development - fallback if no secret configured
    const secret = process.env.SHOPIFY_API_SECRET || '';

    // Use the raw bytes captured by bodyParser.verify so verification matches Shopify's HMAC.
    // `req.rawBody` is set by the `bodyParser.verify` middleware in `src/app.ts`.
    // Fallback to stringified body if rawBody isn't present (useful for tests / dev).
    // Prefer the raw buffer when available.
    const raw = (req as any).rawBody instanceof Buffer ? (req as any).rawBody : Buffer.from(JSON.stringify(req.body));

    if (!secret || !verifyShopifyWebhook(raw, hmac, secret)) {
      console.warn('Shopify webhook verification failed');
      return res.status(401).send('invalid signature');
    }

    const topic = getWebhookTopic(req.headers);
    console.log('Verified webhook:', topic);
    // TODO: queue or process the webhook here
    return res.status(200).send('ok');
  } catch (err) {
    console.error('Error verifying webhook', err);
    return res.status(500).send('error');
  }
});

export default router;
