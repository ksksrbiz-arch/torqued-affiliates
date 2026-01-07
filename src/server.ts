// Copyright (c) 2025 Keith John Skaggs Jr. All rights reserved.
// This software is proprietary, copywritten, and strictly licensed. Unauthorized use is prohibited and will be prosecuted.
// Initialize tracing first so the SDK instruments modules used by the app.
import './tracing';
import { buildApp } from './app';
import { config, validateConfig } from './config';
import { createDbClient } from './db';

const port = process.env.PORT || config.PORT || 4000;

(async () => {
  validateConfig();
  // Connect to DB if configured (noop for memory)
  const db = await createDbClient();
  await db.connect();

  const app = buildApp();

  await app.listen({ port: Number(port), host: '0.0.0.0' });
  app.log.info(`Torqued Affiliates backend listening on port ${port}`);

  // graceful shutdown
  const shutdown = async () => {
    app.log.info('Shutting down...');
    await db.disconnect();
    await app.close();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
})();
