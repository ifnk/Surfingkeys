#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BUILD_DIR="$ROOT_DIR/dist/development/chrome"
TARGET_DIR="${SURFINGKEYS_CHROME_BUILD_DIR:-/mnt/d/temp/surfingkeys-build}"

cd "$ROOT_DIR"

npm run build:chrome

mkdir -p "$TARGET_DIR"
# DrvFS 不支持完整的 Unix owner/group/permission 语义，并可能拒绝 rsync 临时文件重命名。
rsync -rl --delete --inplace --no-owner --no-group --no-perms "$BUILD_DIR"/ "$TARGET_DIR"/

echo "Chrome extension build copied to: $TARGET_DIR"
echo "Windows path: D:\\temp\\surfingkeys-build"
