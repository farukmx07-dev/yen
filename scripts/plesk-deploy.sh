#!/bin/bash
set -euo pipefail

cd "$(dirname "$0")/.."

echo ">> npm install"
npm install

echo ">> npm run build"
npm run build

echo ">> Plesk deploy tamamlandi. Panelden Restart App yapin."
