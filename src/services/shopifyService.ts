import crypto from 'crypto';

export function verifyShopifyWebhook(rawBody: Buffer, hmacHeader: string | undefined, secret: string): boolean {
  if (!hmacHeader) return false;
  const digest = crypto.createHmac('sha256', secret).update(rawBody).digest('base64');
  return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(hmacHeader));
}

export function getWebhookTopic(headers: any): string | null {
  return headers['x-shopify-topic'] || null;
}

/**
 * Verify App Proxy signatures.
 *
 * NOTE: Shopify's App Proxy signature method is documented in Shopify docs and apps should
 * implement the exact verification algorithm described there. This helper demonstrates
 * a reasonable approach: compute an HMAC-SHA256 over the sorted query params (excluding signature)
 * and compare against the provided signature parameter. Adjust to the precise spec for your app.
 */
export function verifyAppProxySignature(query: Record<string, string | undefined>, secret: string): boolean {
  const signature = (query['signature'] || query['hmac']);
  if (!signature) return false;

  // Build a message from sorted params excluding 'signature'
  const entries = Object.entries(query)
    .filter(([k]) => k !== 'signature' && k !== 'hmac')
    .map(([k, v]) => [k, v ?? ''] as [string, string])
    .sort((a, b) => a[0].localeCompare(b[0]));

  const message = entries.map(([k, v]) => `${k}=${v}`).join('');
  const digest = crypto.createHmac('sha256', secret).update(message).digest('hex');
  return digest === signature;
}

/**
 * Verify OAuth callback HMAC
 * Shopify sends an `hmac` parameter during OAuth callback. This verifies the query string (excluding `hmac`) using
 * HMAC-SHA256 with your client secret. See Shopify docs for specifics.
 */
export function verifyOAuthCallbackHmac(query: Record<string, string | undefined>, secret: string): boolean {
  const hmac = query['hmac'];
  if (!hmac) return false;

  // Shopify requires building the message by sorting the query params (alphabetically) and joining k=v pairs
  const kv = Object.entries(query)
    .filter(([k]) => k !== 'hmac')
    .map(([k, v]) => [k, v ?? ''] as [string, string])
    .sort((a, b) => a[0].localeCompare(b[0]));

  const message = kv.map(([k, v]) => `${k}=${v}`).join('&');
  const digest = crypto.createHmac('sha256', secret).update(message).digest('hex');
  return digest === hmac;
}
