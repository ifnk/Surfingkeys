#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BUILD_DIR="$ROOT_DIR/dist/development/chrome"
TARGET_DIR="${SURFINGKEYS_CHROME_BUILD_DIR:-/mnt/d/temp/surfingkeys-build}"
MARKDOWN_VIEWER_DIR="${MARKDOWN_VIEWER_SOURCE_DIR:-$ROOT_DIR/../markdown-viewer-custom}"

cd "$ROOT_DIR"

npm run build:chrome

# 把自用 Markdown Viewer 作为内部模块装进同一个 Chrome 扩展。
sh "$MARKDOWN_VIEWER_DIR/build/package.sh" chrome > /dev/null
for asset in content themes vendor background; do
  rsync -rl --inplace "$MARKDOWN_VIEWER_DIR/$asset/" "$BUILD_DIR/$asset/"
done
mkdir -p "$BUILD_DIR/icons/default"
rsync -rl --inplace "$MARKDOWN_VIEWER_DIR/icons/default/" "$BUILD_DIR/icons/default/"
cp "$MARKDOWN_VIEWER_DIR/LICENSE" "$BUILD_DIR/markdown-viewer-LICENSE"

mkdir -p "$TARGET_DIR"
# DrvFS 不支持完整的 Unix owner/group/permission 语义，并可能拒绝 rsync 临时文件重命名。
rsync -rl --delete --inplace --no-owner --no-group --no-perms "$BUILD_DIR"/ "$TARGET_DIR"/

echo "Chrome extension build copied to: $TARGET_DIR"
echo "Windows path: D:\\temp\\surfingkeys-build"
