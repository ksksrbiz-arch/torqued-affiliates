// Copyright (c) 2025 Keith John Skaggs Jr. All rights reserved.
// This software is proprietary, copywritten, and strictly licensed. Unauthorized use is prohibited and will be prosecuted.

import dotenv from 'dotenv';
dotenv.config();

// Azure Key Vault integration (see docs/secret-store.md)
let getSecret: ((name: string) => Promise<string | undefined>) | undefined;
if (process.env.AZURE_KEYVAULT_URI) {
  try {
    const { DefaultAzureCredential } = require('@azure/identity');
    const { SecretClient } = require('@azure/keyvault-secrets');
    const credential = new DefaultAzureCredential();
    const secretClient = new SecretClient(process.env.AZURE_KEYVAULT_URI, credential);
    getSecret = async (name: string) => {
      try {
        const secret = await secretClient.getSecret(name);
        return secret.value;
      } catch (err) {
        console.error('KeyVault error:', err);
        return undefined;
      }
    };
  } catch (e) {
    console.warn('Azure Key Vault SDK not installed. Run `npm install @azure/keyvault-secrets @azure/identity` to enable cloud secret store.');
  }
}

const allowedDatabaseTypes = ['memory', 'postgres', 'mongo'] as const;
type DatabaseType = (typeof allowedDatabaseTypes)[number];

export const config = {
  PORT: process.env.PORT ? Number(process.env.PORT) : 4000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  APP_SECRET: process.env.APP_SECRET || 'dev-secret',
  DATABASE_URL: process.env.DATABASE_URL || '',
  DATABASE_TYPE: (process.env.DATABASE_TYPE || 'memory') as DatabaseType,
  MONGO_DB: process.env.MONGO_DB || 'torqued_affiliates',
  SHOPIFY_API_KEY: process.env.SHOPIFY_API_KEY || '',
  SHOPIFY_API_SECRET: process.env.SHOPIFY_API_SECRET || '',
  getSecret // async function, if available
};

export function validateConfig(): void {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!Number.isFinite(config.PORT) || config.PORT <= 0) {
    errors.push('PORT must be a positive number.');
  }

  if (!allowedDatabaseTypes.includes(config.DATABASE_TYPE)) {
    errors.push(`DATABASE_TYPE must be one of: ${allowedDatabaseTypes.join(', ')}.`);
  }

  if (config.DATABASE_TYPE !== 'memory' && !config.DATABASE_URL) {
    errors.push(`DATABASE_URL is required when DATABASE_TYPE is ${config.DATABASE_TYPE}.`);
  }

  if (config.NODE_ENV === 'production' && config.APP_SECRET === 'dev-secret') {
    errors.push('APP_SECRET must be set to a non-default value in production.');
  }

  if (!config.SHOPIFY_API_KEY || !config.SHOPIFY_API_SECRET) {
    warnings.push('SHOPIFY_API_KEY and SHOPIFY_API_SECRET should be set for Shopify integrations.');
  }

  if (config.NODE_ENV === 'production' && (!config.SHOPIFY_API_KEY || !config.SHOPIFY_API_SECRET)) {
    errors.push('SHOPIFY_API_KEY and SHOPIFY_API_SECRET are required in production.');
  }

  if (warnings.length > 0) {
    console.warn(`Config warnings:\n- ${warnings.join('\n- ')}`);
  }

  if (errors.length > 0) {
    throw new Error(`Config validation failed:\n- ${errors.join('\n- ')}`);
  }
}

// For GCP/AWS, see docs/secret-store.md for integration code snippets.
