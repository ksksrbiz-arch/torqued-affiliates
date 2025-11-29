# Secure Secret Store Integration

This backend can be configured to use a cloud secret manager for sensitive credentials (API keys, DB passwords, etc). Supported options:

- **Azure Key Vault** (recommended for Node.js/TypeScript)
- **GCP Secret Manager**
- **AWS Secrets Manager**

## Azure Key Vault Example

1. Install SDK:
   ```sh
   npm install @azure/keyvault-secrets @azure/identity
   ```
2. Add to `.env`:
   ```
   AZURE_KEYVAULT_URI=https://<your-keyvault-name>.vault.azure.net/
   AZURE_CLIENT_ID=<your-client-id>
   AZURE_TENANT_ID=<your-tenant-id>
   AZURE_CLIENT_SECRET=<your-client-secret>
   ```
3. Update `src/config/index.ts`:
   ```ts
   import { DefaultAzureCredential } from '@azure/identity';
   import { SecretClient } from '@azure/keyvault-secrets';
   
   const keyVaultUri = process.env.AZURE_KEYVAULT_URI;
   let secretClient: SecretClient | undefined;
   if (keyVaultUri) {
     const credential = new DefaultAzureCredential();
     secretClient = new SecretClient(keyVaultUri, credential);
   }
   
   export async function getSecret(name: string): Promise<string | undefined> {
     if (!secretClient) return undefined;
     try {
       const secret = await secretClient.getSecret(name);
       return secret.value;
     } catch (err) {
       console.error('KeyVault error:', err);
       return undefined;
     }
   }
   ```
4. Use `await getSecret('SHOPIFY_API_KEY')` in your app for secrets.

## GCP Secret Manager Example
- Install: `npm install @google-cloud/secret-manager`
- See [GCP docs](https://cloud.google.com/secret-manager/docs/reference/libraries#client-libraries-install-nodejs)

## AWS Secrets Manager Example
- Install: `npm install @aws-sdk/client-secrets-manager`
- See [AWS docs](https://docs.aws.amazon.com/secretsmanager/latest/userguide/retrieving-secrets_nodejs.html)

## Notes
- Always use environment variables for cloud credentials.
- Never commit secrets to source control.
- See this file for integration code snippets and links to official docs.
