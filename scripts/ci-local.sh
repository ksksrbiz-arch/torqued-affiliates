#!/usr/bin/env bash
set -euo pipefail
echo "Running Local CI Simulation..."

echo "1. Installing..."
npm ci

echo "2. Linting..."
npx eslint . --ext .js,.jsx --no-error-on-unmatched-pattern

echo "3. Testing..."
# Check if test script exists
if npm run | grep -q "test"; then
  npm test
else
  echo "No test script, skipping."
fi

echo "4. Building..."
npm run build

echo "✅ Local CI Success."
