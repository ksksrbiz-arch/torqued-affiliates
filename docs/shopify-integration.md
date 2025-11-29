# Copyright (c) 2025 Keith John Skaggs Jr. All rights reserved.
# This software is proprietary, copywritten, and strictly licensed. Unauthorized use is prohibited and will be prosecuted.
# Shopify Integration Guide (Backend)

This backend repository provides API endpoints and webhooks intended to integrate with a Shopify-hosted frontend (store or app). The front-end will be deployed on Shopify and communicate with this API.

Recommended endpoints

- /auth — authentication endpoint for the app or admin panel (issue tokens/cookies)
  - POST /auth/login — login (exchange credential for session token)

- /affiliates — endpoints to manage affiliates and track conversions
  - GET /affiliates — list/search
  - POST /affiliates/track — track a click, visit or sale (called from the front-end and/or an app-proxy)

- /webhooks/shopify — receive Shopify webhooks (order/create, checkout/create, etc.)
  - Verify the HMAC using SHOPIFY_API_SECRET before processing

Integration notes

- App Proxy: If the Shopify front-end will use app proxy, configure the app proxy URL in Shopify to point to your backend domain and implement the path mapping on the backend.

- CORS & Security: Ensure CORS is allowed only for the expected store front domain and use CSP/secure headers.

- Webhook verification: Shopify signs webhook POSTs using HMAC-SHA256 of the payload. Validate signatures before processing webhooks to prevent spoofing.

- Rate limits: Shopify enforces rate limits — implement retry/backoff and queueing for heavy webhook loads.

- Auth: For server-to-server calls use API keys or tokens. For store visitors (tracking) you may use signed cookies or short-lived tokens.

Example: order webhook processing steps
1. Verify HMAC signature header (X-Shopify-Hmac-Sha256).  
2. Parse the body (do not re-parse if you validated HMAC using raw body bytes).  
3. Enqueue or process the conversion event and attribute to affiliate if available. 

This is only a starter guide — when implementing production grade integration, add secure storage, robust retry queues, logging, and monitoring.

App Proxy and OAuth (native Shopify)

- App Proxy: If you configure an App Proxy in your Shopify Partner app settings, Shopify will call the proxy path on your backend with query parameters and a signature. This backend includes a sample `GET /shopify/proxy` endpoint which verifies the `signature`/`hmac` in the query string and returns HTML content suitable for embedding on a storefront page. You must configure `SHOPIFY_API_SECRET` in your environment so the server can validate requests.

- OAuth install: This scaffold includes example endpoints `GET /shopify/install` (redirects merchant to the install flow — pass `?shop=store.myshopify.com`) and `GET /shopify/callback` (callback to exchange the authorization `code` for an access token). Set the environment variables `SHOPIFY_API_KEY`, `SHOPIFY_API_SECRET`, `SHOPIFY_REDIRECT_URI`, and `SHOPIFY_SCOPES`.

IMPORTANT: Security & verification

- Webhooks: The app verifies webhook HMAC using the raw request bytes — ensure that the body parser in Express preserves raw bytes (this scaffold captures them for accurate verification). The webhook route uses `x-shopify-hmac-sha256` header.
- App Proxy payloads: Verify the signature exactly as Shopify documents for app proxies. The `src/services/shopifyService.ts` includes a `verifyAppProxySignature` helper as a starting point — test and adjust to match the exact Shopify algorithm for your app.

Persistence & production considerations

- This scaffold supports multiple persistence backends controlled by `DATABASE_TYPE` in `.env` (options: `memory` (default), `postgres`, `mongo`).
- When `postgres` is configured the app will automatically create minimal tables for `shops` and `oauth_states` on startup (used to store merchant access tokens and pending OAuth states). When `mongo` is configured the app uses Mongoose schemas.
- It's recommended to encrypt or otherwise secure persisted tokens and store them in a vault/secure DB in production. Rotate tokens if you migrate from a legacy system.
