#!/usr/bin/env bash
# Fix the 404 — Vercel auto-detected /public/ as the web root and
# started ignoring the project-root /index.html. Move media to /media/.
set -e
cd "$(dirname "$0")"

rm -f .git/index.lock || true

echo "→ Moving public/media → media at repo root..."
git mv public/media media
# Remove the now-empty public directory
rmdir public 2>/dev/null || true

echo "→ Committing..."
git add -A
git commit -m "Fix 404 — move /public/media → /media so Vercel serves index.html

Vercel auto-detected /public/ as the static web root after that folder
appeared, causing the project-root index.html to be skipped (/ returned
404 even though /media/* served fine). Moving media to /media/ at root
restores normal static serving — no Vercel config needed."

echo "→ Pushing..."
git push origin main

echo ""
echo "✓ Pushed. Vercel will redeploy in ~60s."
echo "  Live: https://www.linbix.com"
