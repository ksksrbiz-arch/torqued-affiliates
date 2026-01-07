// Copyright (c) 2025 Keith John Skaggs Jr. All rights reserved.
// This software is proprietary, copywritten, and strictly licensed. Unauthorized use is prohibited and will be prosecuted.
import { FastifyPluginAsync } from 'fastify';
import { verifyShopifyWebhook, getWebhookTopic } from '../services/shopifyService';

const webhooksRoutes: FastifyPluginAsync = async (fastify) => {
  // NOTE: For proper HMAC verification you must read the raw request body bytes.
  // `request.rawBody` is added by the @fastify/raw-body plugin in `src/app.ts`.
  fastify.post(
    '/shopify',
    {
      schema: {
        body: {
          type: 'object',
          additionalProperties: true
        },
        response: {
          200: { type: 'string' },
          401: { type: 'string' },
          500: { type: 'string' }
        }
      }
    },
    async (request, reply) => {
      try {
        // Header set by Shopify
        const hmac = request.headers['x-shopify-hmac-sha256'] as string | undefined;
        // For local development - fallback if no secret configured
        const secret = process.env.SHOPIFY_API_SECRET || '';

        const raw = Buffer.isBuffer(request.rawBody)
          ? request.rawBody
          : Buffer.from(JSON.stringify(request.body ?? {}));

        if (!secret || !verifyShopifyWebhook(raw, hmac, secret)) {
          request.log.warn('Shopify webhook verification failed');
          reply.code(401).send('invalid signature');
          return;
        }

        const topic = getWebhookTopic(request.headers);
        request.log.info({ topic }, 'Verified webhook');
        // TODO: queue or process the webhook here
        reply.code(200).send('ok');
      } catch (err) {
        request.log.error({ err }, 'Error verifying webhook');
        reply.code(500).send('error');
      }
    }
  );
};

export default webhooksRoutes;
