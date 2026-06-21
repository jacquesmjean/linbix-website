#!/usr/bin/env bash
# Ship: remove 3 old gallery photos per Luc's request
set -e
cd "$(dirname "$0")"
rm -f .git/index.lock || true

echo "→ git add..."
git add -A

echo "→ Committing..."
git commit -m "Remove 3 old gallery photos per Luc's request

Removed from the home page showcase:
  ▸ Better Together (empty room neon shot) — img_9550
  ▸ Trabajamos mejor juntos (Better Together video) — img_7765
  ▸ Networking ejecutivo (group photo) — img_0094

Also swapped these images out of every hero, event card, blog
hero, and social-share meta tag where they appeared. Replaced
with rooftop / terrace photos:
  ▸ img_rooftop_lounge.jpg (split image, members soirée, OG card, JSON-LD)
  ▸ img_rooftop_bar.jpg (international mixer, intl-entry hero, blog hero)
  ▸ img_rooftop_tables.jpg (dobiz hero)

All Better Together captions removed.
Twitter and Open Graph share cards now show the rooftop lounge.
" \
  --allow-empty

echo "→ Pushing..."
git push origin main

echo ""
echo "✓ Pushed. Vercel auto-deploys in ~60s."
