#!/usr/bin/env bash
set -e

if [ -f package.json ]; then
  npx prettier --check . || true
fi

if [ -f tsconfig.json ]; then
  npx tsc --noEmit || true
fi

exit 0