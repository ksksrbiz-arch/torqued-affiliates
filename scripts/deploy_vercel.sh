#!/usr/bin/env bash
set -euo pipefail

echo "🚀 preparing Vercel Deployment..."

if [ ! -d .git ]; then
  echo "❌ Run from repo root (no .git directory found)." >&2
  exit 1
fi

# Stage files
git add .

# Commit
git commit -m "chore: automated deployment sync via script" || echo "⚠️ Nothing to commit."

echo "✅ Changes committed."
echo "👉 Run 'vercel' to deploy locally, or push to GitHub to trigger Vercel Auto-Deploy."
