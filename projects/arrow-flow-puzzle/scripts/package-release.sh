#!/usr/bin/env bash
set -e

echo "📦 Packaging ArrowFlow Turnkey Commercial Distribution Bundle..."

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DIST_DIR="$PROJECT_DIR/dist"
ARCHIVE_NAME="ArrowFlow-Turnkey-Commercial-v1.0.0.zip"

rm -rf "$DIST_DIR"
mkdir -p "$DIST_DIR"

cd "$PROJECT_DIR"

# Create clean zip excluding node_modules, .next, and dist
zip -r "$DIST_DIR/$ARCHIVE_NAME" . \
  -x "node_modules/*" \
  -x ".next/*" \
  -x "dist/*" \
  -x ".git/*" \
  -x "*.log" \
  -x ".DS_Store"

echo "✅ Turnkey Release Archive created successfully at:"
echo "   $DIST_DIR/$ARCHIVE_NAME"
echo "   Ready to upload to Gumroad, CodeCanyon, or deliver to clients for $49 - $149."
