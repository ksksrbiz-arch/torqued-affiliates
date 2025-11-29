# Torqued Affiliates — Backend

Minimal, ready-to-extend Node.js + TypeScript backend for the Torqued Affiliates program.

This repository is intended to serve as the main backend for the program. The frontend UI will be deployed via Shopify; this backend provides the supporting APIs, webhook endpoints, and affiliate tracking logic.

Quick start

1. Copy `.env.example` to `.env` and update environment variables.
2. Install dependencies:

```pwsh
npm install
```

3. Start developer server:

```pwsh
npm run dev
```

4. Run tests:

```pwsh
npm test
```

What's included

- Minimal Express server in TypeScript
- Routes: /health, /auth, /affiliates, /webhooks
- .env.example for local configuration
- Basic tests and CI workflow
- docs/branch-sync.md — instructions for syncing branches from an existing repo into this new repo
- docs/shopify-integration.md — tips for connecting a Shopify-hosted frontend to this backend

Next steps

- Implement persistent storage (Postgres, MongoDB or another store)
- Add real authentication and permissions
- Add billing / webhooks verification for Shopify

Migration from legacy repo

If you need to copy branches from an existing (legacy) repository into this new one, see `docs/branch-sync.md` and use `tools/branch-sync.ps1` for a mirror-style migration. Be careful with mirrors — they overwrite refs in the target repo.

Basic selective migration:

```pwsh
# clone the old repo locally
git clone https://github.com/OLD_ORG/old-repo.git tmp-old && cd tmp-old
# add the new repo as a remote
git remote add new-origin https://github.com/YOUR_ORG/torqued-affiliates.git
# push the branches you want to keep
git push new-origin master:master
git push new-origin 'feature/x':'feature/x'
```
