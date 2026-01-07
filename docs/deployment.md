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

# Deployment Process and CI/CD

This document describes the deployment process, CI/CD pipeline, and infrastructure requirements for the Torqued Affiliates backend.

## Table of Contents

- [CI/CD Pipeline Overview](#cicd-pipeline-overview)
- [Environment Configuration](#environment-configuration)
- [Deployment Strategies](#deployment-strategies)
- [Pre-Deployment Checklist](#pre-deployment-checklist)
- [Production Deployment](#production-deployment)
- [Rollback Procedures](#rollback-procedures)
- [Monitoring and Health Checks](#monitoring-and-health-checks)

## CI/CD Pipeline Overview

The project uses GitHub Actions for continuous integration and deployment:

### CI Workflow (`.github/workflows/ci.yml`)

Runs on every push and pull request:

1. **Build** - Compiles TypeScript to JavaScript (`npm run build`)
2. **Test** - Runs unit and integration tests (`npm test`)
3. **Lint** - Code quality checks (if configured)

**Trigger:** All pushes and pull requests  
**Node Version:** 20.x  
**Status:** Must pass before merging to main

### Security Workflow (`.github/workflows/security.yml`)

Runs on main branch pushes, pull requests, and weekly schedule:

1. **CodeQL Analysis** - Static code security scanning
2. **NPM Audit** - Checks for known vulnerabilities in dependencies
3. **OWASP Dependency-Check** - Additional dependency vulnerability scanning
4. **Secret Detection** - Scans for accidentally committed secrets

**Trigger:** Push to main, PRs to main, weekly Monday 02:00 UTC  
**Required:** All security checks must pass for production deployments

### Release Workflow (`.github/workflows/release.yml`)

Runs on main branch pushes:

1. **Semantic Release** - Automated versioning and changelog generation
2. **Package Publishing** - Creates GitHub releases

**Trigger:** Push to main branch  
**Purpose:** Automated release management

## Environment Configuration

### Required Environment Variables

All environments require these variables:

```bash
# Server Configuration
PORT=4000
NODE_ENV=production  # or development, staging

# Database Configuration
DATABASE_TYPE=postgres  # or mongo, memory
DATABASE_URL=postgresql://user:pass@host:5432/dbname
MONGO_DB=torqued_affiliates  # Required if DATABASE_TYPE=mongo

# Application Security
APP_SECRET=<strong-random-secret>  # Never use 'dev-secret' in production

# Shopify Integration
SHOPIFY_API_KEY=<your-api-key>
SHOPIFY_API_SECRET=<your-api-secret>
SHOPIFY_REDIRECT_URI=https://your-domain.com/shopify/callback
SHOPIFY_SCOPES=read_products,read_orders

# Observability (Optional)
OTLP_ENDPOINT=http://otel-collector:4319/v1/traces
```

### Azure Key Vault Integration (Recommended for Production)

```bash
# Azure Key Vault
AZURE_KEYVAULT_URI=https://your-vault.vault.azure.net/
AZURE_CLIENT_ID=<service-principal-client-id>
AZURE_CLIENT_SECRET=<service-principal-secret>
AZURE_TENANT_ID=<azure-tenant-id>
```

See `docs/secret-store.md` for detailed setup instructions.

### Configuration Validation

The application validates all critical configuration at startup using `validateConfig()`:

- **PORT** must be a positive integer
- **DATABASE_TYPE** must be one of: memory, postgres, mongo
- **DATABASE_URL** is required for postgres/mongo
- **MONGO_DB** must be explicitly set in production when using MongoDB
- **APP_SECRET** cannot be the default 'dev-secret' in production
- **SHOPIFY_API_KEY** and **SHOPIFY_API_SECRET** are required in production

If validation fails, the application will exit immediately with a detailed error message.

## Deployment Strategies

### 1. Container-Based Deployment (Recommended)

**Using Docker:**

```bash
# Build the Docker image
docker build -t torqued-affiliates:latest .

# Run with environment variables
docker run -p 4000:4000 \
  --env-file .env.production \
  torqued-affiliates:latest
```

**Using Docker Compose (Development):**

```bash
# Start all services (app, postgres, mongo, observability)
npm run docker:up

# Stop all services
npm run docker:down
```

### 2. Cloud Platform Deployment

#### Azure App Service

```bash
# Prerequisites: Azure CLI installed and logged in
az login

# Create resource group
az group create --name torqued-rg --location eastus

# Create App Service plan
az appservice plan create \
  --name torqued-plan \
  --resource-group torqued-rg \
  --sku B1 \
  --is-linux

# Create web app
az webapp create \
  --name torqued-affiliates \
  --resource-group torqued-rg \
  --plan torqued-plan \
  --runtime "NODE:20-lts"

# Configure environment variables
az webapp config appsettings set \
  --name torqued-affiliates \
  --resource-group torqued-rg \
  --settings \
    NODE_ENV=production \
    DATABASE_TYPE=postgres \
    DATABASE_URL="@Microsoft.KeyVault(SecretUri=...)"

# Deploy from GitHub
az webapp deployment source config \
  --name torqued-affiliates \
  --resource-group torqued-rg \
  --repo-url https://github.com/ksksrbiz-arch/torqued-affiliates \
  --branch main
```

#### Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Configure environment variables via Vercel dashboard
# or use vercel env commands
```

#### AWS Elastic Beanstalk

```bash
# Install EB CLI
pip install awsebcli

# Initialize EB application
eb init -p node.js-20 torqued-affiliates

# Create environment
eb create production-env \
  --database.engine postgres \
  --database.username dbuser

# Deploy
eb deploy
```

### 3. Traditional Server Deployment

**Prerequisites:**
- Node.js 20.x or later
- PostgreSQL 15+ (or MongoDB 7+)
- PM2 or similar process manager

**Deployment steps:**

```bash
# 1. Clone repository
git clone https://github.com/ksksrbiz-arch/torqued-affiliates.git
cd torqued-affiliates

# 2. Checkout production branch
git checkout main

# 3. Install dependencies
npm ci --production

# 4. Build application
npm run build

# 5. Set up environment variables
cp .env.example .env
# Edit .env with production values

# 6. Run database migrations
npm run migrate  # Configure this script

# 7. Start with PM2
pm2 start dist/index.js --name torqued-affiliates
pm2 save
pm2 startup
```

## Pre-Deployment Checklist

Before deploying to production:

- [ ] All CI checks pass (build, test, lint)
- [ ] Security scans pass (CodeQL, npm audit, OWASP)
- [ ] Environment variables configured in target environment
- [ ] Database migrations prepared and tested
- [ ] Azure Key Vault configured with all secrets
- [ ] Monitoring and logging configured
- [ ] Health check endpoint accessible (`/health`)
- [ ] SSL/TLS certificates configured
- [ ] Firewall rules configured (only expose necessary ports)
- [ ] Backup strategy in place for database
- [ ] Rollback plan documented
- [ ] Stakeholders notified of deployment window

## Production Deployment

### Step-by-Step Production Deployment

1. **Pre-deployment preparation:**
   ```bash
   # Ensure you're on the main branch
   git checkout main
   git pull origin main
   
   # Verify CI status
   gh run list --branch main --limit 1
   ```

2. **Database migrations:**
   ```bash
   # Connect to production database securely
   # Run migrations from /migrations folder
   # Use a migration tool like node-pg-migrate or db-migrate
   
   # Example:
   npx db-migrate up --env production
   ```

3. **Deploy application:**
   
   **For containerized deployments:**
   ```bash
   # Build production image
   docker build -t torqued-affiliates:$(git rev-parse --short HEAD) .
   
   # Tag as latest
   docker tag torqued-affiliates:$(git rev-parse --short HEAD) torqued-affiliates:latest
   
   # Push to registry
   docker push your-registry/torqued-affiliates:latest
   
   # Deploy to orchestrator (Kubernetes, ECS, etc.)
   kubectl apply -f k8s/production/
   ```

   **For PaaS deployments:**
   ```bash
   # Deploy via platform CLI
   az webapp up --name torqued-affiliates  # Azure
   vercel --prod                            # Vercel
   eb deploy                                # AWS
   ```

4. **Post-deployment verification:**
   ```bash
   # Check health endpoint
   curl https://your-domain.com/health
   
   # Verify application logs
   # Check monitoring dashboards
   # Run smoke tests
   ```

5. **Monitor for issues:**
   - Watch application logs for errors
   - Monitor response times and error rates
   - Check database connection pool status
   - Verify webhook endpoints are functioning

## Rollback Procedures

### Quick Rollback

**For container-based deployments:**
```bash
# Rollback to previous image version
kubectl rollout undo deployment/torqued-affiliates

# Or deploy specific version
docker pull your-registry/torqued-affiliates:previous-tag
docker run -p 4000:4000 your-registry/torqued-affiliates:previous-tag
```

**For PaaS deployments:**
```bash
# Azure App Service
az webapp deployment slot swap \
  --name torqued-affiliates \
  --resource-group torqued-rg \
  --slot staging

# Vercel
vercel rollback

# AWS Elastic Beanstalk
eb use production-env
eb deploy --version previous-version
```

### Database Rollback

If migrations need to be rolled back:

```bash
# Using migration tool
npx db-migrate down --env production

# Manual rollback
psql -h host -U user -d dbname -f migrations/rollback-script.sql
```

### Emergency Procedures

1. **Traffic cutoff:** Update DNS or load balancer to redirect traffic
2. **Maintenance mode:** Deploy static maintenance page
3. **Database backup restore:** Restore from most recent backup
4. **Incident communication:** Notify stakeholders via established channels

## Monitoring and Health Checks

### Health Check Endpoint

The application exposes a health check at `/health`:

```bash
curl https://your-domain.com/health
# Expected response:
# {"status":"ok","uptime":1234.56,"timestamp":"2025-12-27T20:00:00.000Z"}
```

### Observability

**OpenTelemetry Integration:**

The application includes OpenTelemetry instrumentation for:
- Distributed tracing
- Metrics collection
- Log correlation

Configure `OTLP_ENDPOINT` to send telemetry to your collector.

**Recommended Monitoring Tools:**
- **APM:** Datadog, New Relic, or Dynatrace
- **Logs:** CloudWatch, Azure Monitor, or Splunk
- **Uptime:** Pingdom, UptimeRobot, or StatusCake
- **Tracing:** Jaeger or Zipkin (see `docker-compose.yml`)

### Key Metrics to Monitor

- **Response Time:** p50, p95, p99 latencies
- **Error Rate:** 4xx and 5xx response rates
- **Request Rate:** Requests per second
- **Database Connections:** Active connection pool size
- **Memory Usage:** Heap size and RSS
- **CPU Usage:** Process CPU percentage
- **Event Loop Lag:** Node.js event loop delay

### Alerting Thresholds

Configure alerts for:
- Error rate > 5% over 5 minutes
- p95 response time > 1000ms over 10 minutes
- Health check failures (3 consecutive failures)
- Memory usage > 80% for 5 minutes
- Database connection pool exhausted

## Additional Resources

- [Secret Store Configuration](./secret-store.md)
- [Database Migration Strategy](../migrations/README.md)
- [Docker Development Setup](./docker-dev.md)
- [Branch Protection Rules](./branch-protection.md)
- [Security Policy](../SECURITY.md)

## Support and Troubleshooting

For deployment issues:
1. Check application logs for error messages
2. Verify environment variables are correctly set
3. Ensure database connectivity
4. Review recent changes in git history
5. Consult runbooks for common issues

For emergencies, contact the on-call engineer via established procedures.
