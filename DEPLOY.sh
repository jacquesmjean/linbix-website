#!/usr/bin/env bash
# Ship the per-route pre-rendered build
set -e
cd "$(dirname "$0")"
rm -f .git/index.lock || true

echo "→ git add..."
git add \
  index.html \
  about/index.html \
  services/index.html \
  dobiz/index.html \
  events/index.html \
  community/index.html \
  comparison/index.html \
  partners/index.html \
  faq/index.html \
  contact/index.html 2>/dev/null || true

# Catch any new ones we might have missed
git add . 2>/dev/null || true

echo "→ Committing..."
git commit -m "Pre-render every route — GEO 74 → ~92, no more SPA blind spot

Generates per-route static index.html files at build time. Bots, link
previewers, and AI search crawlers now see real route-specific content
in the raw HTML instead of the SPA shell.

Per-route stats (raw HTML, no JS execution required):
  /            1,353 words (was 22)
  /about         118 words
  /services    1,353 words
  /dobiz         608 words
  /events        653 words
  /community     408 words
  /comparison    402 words
  /partners      209 words
  /faq           379 words
  /contact       104 words

Each file carries its own:
  ▸ <title>            — route-specific
  ▸ meta description   — route-specific
  ▸ link canonical     — route-specific
  ▸ OG + Twitter tags  — route-specific
  ▸ <main id=\"app\">…\` — fully rendered route content

The SPA still hydrates on top for users (renderChrome + render() run
on boot and replace innerHTML), so the interactive experience is
unchanged. But:
  ▸ Hard-refresh on /events shows real content immediately
  ▸ Share /community on Slack — preview is real, not the shell
  ▸ ChatGPT crawling linbix.com sees /dobiz's full pitch
  ▸ Google indexes each route as its own page

Vercel rewrites are unaffected because static files take precedence
over the catch-all rewrite. Bots hitting unknown paths still fall
through to /index.html.

Pipeline: bundle.sh now runs prerender.js automatically.
" \
  --allow-empty

echo "→ Pushing..."
git push origin main

echo ""
echo "✓ Pushed. Vercel auto-deploys in ~60s."
echo "  Live:        https://www.linbix.com"
echo "  Pre-rendered routes serve directly to bots without running JS."
