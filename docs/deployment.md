# Deployment

## Platform

This backend is deployed on **Vercel**. The repository includes a `.vercel/` directory for project linkage and the CI/CD pipeline uses Vercel’s deployment API.

## Deployment artifact

Vercel builds the project using its **buildpack-style Node.js build pipeline** (not a Docker image). The output is a Vercel serverless deployment built from the TypeScript sources (`npm run build`).

## CI/CD (GitHub Actions)

Deployments run automatically on every push to `main` via the workflow in `.github/workflows/deploy.yml`. The workflow ensures successful completion by:

1. Building the project (`npm run build`)
2. Running tests (`npm test`)
3. Deploying to Vercel only if build and tests pass

### Required GitHub Secrets

Add the following secrets in the GitHub repo settings:

- `VERCEL_TOKEN` — Vercel personal token with deploy permissions.
- `VERCEL_ORG_ID` — Vercel organization ID.
- `VERCEL_PROJECT_ID` — Vercel project ID.

### Vercel project linkage

Update `.vercel/project.json` with the real Vercel project and org IDs after linking the repo in Vercel.

## Environment variables

Set these variables in Vercel (Project → Settings → Environment Variables):

| Variable | Example | Description |
| --- | --- | --- |
| `PORT` | `4000` | HTTP port used by the Express app (Vercel sets internally; keep for local dev). |
| `NODE_ENV` | `production` | Environment mode (`development` for local). |
| `APP_SECRET` | `replace-with-secure-random` | Secret used for signing/crypto operations. |
| `DATABASE_URL` | `postgres://user:pass@host:5432/torqued_affiliates` | Postgres connection string. |
| `DATABASE_TYPE` | `postgres` | `memory`, `postgres`, or `mongo`. |
| `MONGO_DB` | `torqued_affiliates` | MongoDB database name (if using Mongo). |
| `SHOPIFY_API_KEY` | `...` | Shopify app API key. |
| `SHOPIFY_API_SECRET` | `...` | Shopify app API secret. |
| `SHOPIFY_SHOP_DOMAIN` | `example.myshopify.com` | Target Shopify shop domain. |
| `SHOPIFY_REDIRECT_URI` | `https://your-app.vercel.app/shopify/callback` | OAuth redirect callback URL. |
| `SHOPIFY_SCOPES` | `read_products,read_orders` | Comma-separated OAuth scopes. |

Reference: `.env.example`.

## Release process

1. Merge changes into `main`.
2. GitHub Actions runs the deploy workflow (`.github/workflows/deploy.yml`).
3. The workflow builds and deploys to Vercel Production.
4. Validate the deployment:
   - Check `/health` on the production URL.
   - Confirm Shopify webhooks and OAuth redirect URL are updated (if changed).

