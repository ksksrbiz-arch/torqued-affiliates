// Copyright (c) 2025 Keith John Skaggs Jr. All rights reserved.
// This software is proprietary, copywritten, and strictly licensed. Unauthorized use is prohibited and will be prosecuted.
import { FastifyPluginAsync } from 'fastify';

const authRoutes: FastifyPluginAsync = async (fastify) => {
  // Placeholder routes — replace with real auth logic
  fastify.post(
    '/login',
    {
      schema: {
        body: {
          type: 'object',
          required: ['username'],
          properties: {
            username: { type: 'string', minLength: 1 }
          }
        },
        response: {
          200: {
            type: 'object',
            properties: {
              token: { type: 'string' }
            },
            required: ['token']
          }
        }
      }
    },
    async (request) => {
      const { username } = request.body as { username: string };
      return { token: `demo-token-for-${username}` };
    }
  );
};

export default authRoutes;
