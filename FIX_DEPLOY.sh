#!/usr/bin/env bash
# Fix the SPA rewrite — cleanUrls was preventing the rewrite from firing.
# When user requested /events, cleanUrls tried /events.html first, 404'd,
# and never gave the rewrite a chance.
set -e
cd "$(dirname "$0")"
rm -f .git/index.lock || true

echo "→ git add..."
git add vercel.json

echo "→ Committing..."
git commit -m "Fix SPA rewrite: drop cleanUrls, escape regex dots

The previous vercel.json had both 'cleanUrls: true' AND a rewrite to
index.html. cleanUrls runs BEFORE rewrites and treats /events as an
alias for /events.html — which doesn't exist, so it 404'd before the
rewrite could catch it.

Dropped cleanUrls (we only have one HTML file anyway), and escaped
dots in the negative-lookahead pattern so robots.txt / sitemap.xml /
llms.txt match as literal filenames instead of any-char wildcards." \
  --allow-empty

echo "→ Pushing..."
git push origin main

echo ""
echo "✓ Pushed. Vercel redeploys in ~60s."
echo "  Verify: https://www.linbix.com/events"
