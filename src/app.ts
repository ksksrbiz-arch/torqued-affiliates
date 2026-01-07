// Copyright (c) 2025 Keith John Skaggs Jr. All rights reserved.
// This software is proprietary, copywritten, and strictly licensed. Unauthorized use is prohibited and will be prosecuted.
import Fastify, { FastifyInstance } from 'fastify';
import rawBody from '@fastify/raw-body';
import healthRoutes from './routes/health';
import authRoutes from './routes/auth';
import affiliatesRoutes from './routes/affiliates';
import webhooksRoutes from './routes/webhooks';
import shopifyRoutes from './routes/shopify';
import { registerErrorHandler } from './errorHandler';
import { config } from './config';

export function buildApp(): FastifyInstance {
  const isProduction = config.NODE_ENV === 'production';
  const app = Fastify({
    logger: isProduction ? { level: 'info' } : false
  });

  app.register(rawBody, {
    field: 'rawBody',
    global: true,
    runFirst: true,
    encoding: false
  });

  if (isProduction) {
    app.addHook('onRequest', async (request) => {
      request.log.info({ method: request.method, url: request.url }, 'incoming request');
    });

    app.addHook('onResponse', async (request, reply) => {
      request.log.info(
        {
          method: request.method,
          url: request.url,
          statusCode: reply.statusCode,
          responseTime: reply.elapsedTime
        },
        'request completed'
      );
    });
  }

  app.register(healthRoutes, { prefix: '/health' });
  app.register(authRoutes, { prefix: '/auth' });
  app.register(affiliatesRoutes, { prefix: '/affiliates' });
  app.register(webhooksRoutes, { prefix: '/webhooks' });
  app.register(shopifyRoutes, { prefix: '/shopify' });

  app.get(
    '/',
    {
      schema: {
        response: {
          200: {
            type: 'object',
            properties: {
              ok: { type: 'boolean' },
              name: { type: 'string' }
            },
            required: ['ok', 'name']
          }
        }
      }
    },
    async () => ({ ok: true, name: 'torqued-affiliates-backend' })
  );

  registerErrorHandler(app);

  return app;
}
