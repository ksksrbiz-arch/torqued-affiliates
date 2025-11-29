// Copyright (c) 2025 Keith John Skaggs Jr. All rights reserved.
// This software is proprietary, copywritten, and strictly licensed. Unauthorized use is prohibited and will be prosecuted.
// Initialize tracing first so the SDK instruments modules used by the app.
import './tracing';
import app from './app';
import { config } from './config';
import { createDbClient } from './db';

const port = process.env.PORT || config.PORT || 4000;

(async () => {
  // Connect to DB if configured (noop for memory)
  const db = await createDbClient();
  await db.connect();

  const server = app.listen(port, () => {
    console.log(`Torqued Affiliates backend listening on port ${port}`);
  });

  // graceful shutdown
  process.on('SIGINT', async () => {
    console.log('Shutting down...');
    await db.disconnect();
    server.close(() => process.exit(0));
  });
})();
