#!/usr/bin/env bash
set -euo pipefail
echo "=== Running deployment script ==="

# Switch to repo root
REPO_ROOT="$(git rev-parse --show-toplevel)"

build_site() {
	local name="$1"
	local dir="$2"

	echo "Building $name website"
	cd "$REPO_ROOT/$dir"
	npm install
	npm run buildstatic
}

build_site "garden center" www/sramek-garden-center
build_site "transportation" www/sramek-transportation
build_site "garden studio" www/sramek-studio

cd "$REPO_ROOT"
echo "Running pulumi up"
cd infra
pulumi up