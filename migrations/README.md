# Copyright (c) 2025 Keith John Skaggs Jr. All rights reserved.
# This software is proprietary, copyrighted, and strictly licensed. Unauthorized use is prohibited and will be prosecuted.
# Database Migrations

Place PostgreSQL migration files here (for example `001_init.sql`, `002_add_affiliate_columns.sql`).

Recommended workflow:

1. Add a new numbered SQL file.
2. Apply migrations using a runner such as `node-pg-migrate` or your platform's migration tooling during deploys.

Note: the dev-only bootstrap in `src/db/index.ts` still auto-creates minimal tables for local usage.
