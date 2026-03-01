#!/usr/bin/env bash
echo "=== Running deployment script ==="

# Switch to repo root
REPO_ROOT="$(git rev-parse --show-toplevel)"

cd "$REPO_ROOT"
echo "Building garden center website"
cd www/sramek-garden-center
npm run buildstatic

cd "$REPO_ROOT"
echo "Building transportation website"
cd www/sramek-transportation
npm run buildstatic

cd "$REPO_ROOT"
echo "Running pulumi up"
cd infra
pulumi up