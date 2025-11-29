
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

export const config = {
  PORT: process.env.PORT ? Number(process.env.PORT) : 4000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  APP_SECRET: process.env.APP_SECRET || 'dev-secret',
  DATABASE_URL: process.env.DATABASE_URL || '',
  SHOPIFY_API_KEY: process.env.SHOPIFY_API_KEY || '',
  SHOPIFY_API_SECRET: process.env.SHOPIFY_API_SECRET || '',
  getSecret // async function, if available
};

// For GCP/AWS, see docs/secret-store.md for integration code snippets.
