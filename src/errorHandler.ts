// Copyright (c) 2025 Keith John Skaggs Jr. All rights reserved.
// This software is proprietary, copywritten, and strictly licensed. Unauthorized use is prohibited and will be prosecuted.
import { FastifyInstance } from 'fastify';

export function registerErrorHandler(app: FastifyInstance): void {
  app.setErrorHandler((err, _req, reply) => {
    const statusCode = err.statusCode ?? 500;
    app.log.error({ err }, 'request error');
    reply.status(statusCode).send({ error: err.message || 'Internal Server Error' });
  });
}
