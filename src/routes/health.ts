// Copyright (c) 2025 Keith John Skaggs Jr. All rights reserved.
// This software is proprietary, copywritten, and strictly licensed. Unauthorized use is prohibited and will be prosecuted.
import { FastifyPluginAsync } from 'fastify';

const healthRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get(
    '/',
    {
      schema: {
        response: {
          200: {
            type: 'object',
            properties: {
              uptime: { type: 'number' },
              status: { type: 'string' }
            },
            required: ['uptime', 'status']
          }
        }
      }
    },
    async () => ({ uptime: process.uptime(), status: 'ok' })
  );
};

export default healthRoutes;
