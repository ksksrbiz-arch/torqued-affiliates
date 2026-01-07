// Copyright (c) 2025 Keith John Skaggs Jr. All rights reserved.
// This software is proprietary, copywritten, and strictly licensed. Unauthorized use is prohibited and will be prosecuted.
import { FastifyPluginAsync } from 'fastify';

const affiliatesRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /affiliates — list or search affiliates (stub)
  fastify.get(
    '/',
    {
      schema: {
        response: {
          200: {
            type: 'object',
            properties: {
              affiliates: { type: 'array', items: { type: 'object' } }
            },
            required: ['affiliates']
          }
        }
      }
    },
    async () => ({ affiliates: [] })
  );

  // POST /affiliates/track — record a conversion/visit
  fastify.post(
    '/track',
    {
      schema: {
        body: {
          type: 'object',
          additionalProperties: true
        },
        response: {
          201: {
            type: 'object',
            properties: {
              ok: { type: 'boolean' },
              payload: { type: 'object' }
            },
            required: ['ok', 'payload']
          }
        }
      }
    },
    async (request, reply) => {
      const payload = request.body as Record<string, unknown>;
      reply.code(201);
      return { ok: true, payload };
    }
  );
};

export default affiliatesRoutes;
