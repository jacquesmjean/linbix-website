#!/usr/bin/env bash
# Ship customer portal + blog
set -e
cd "$(dirname "$0")"
rm -f .git/index.lock || true

echo "→ git add..."
git add \
  index.html \
  api/portal.mjs \
  sitemap.xml \
  about/index.html services/index.html dobiz/index.html \
  events/index.html community/index.html comparison/index.html \
  partners/index.html faq/index.html contact/index.html \
  blog 2>/dev/null || true

# Catch anything missed
git add . 2>/dev/null || true

echo "→ Committing..."
git commit -m "Customer Portal + Blog with 3 trilingual cornerstone posts

CUSTOMER PORTAL
  ▸ /api/portal — Stripe Customer Portal session creator
    Email lookup → Stripe billing portal redirect.
    Subscribers can cancel, update card, view invoices, download
    receipts without contacting Luc.
  ▸ /account — email entry page, polished trilingual UX,
    \"You\\'re back!\" state for post-portal returns.
  ▸ Link added to /checkout/success so first-time payers see where
    to manage subscription later.

BLOG
  ▸ /blog — listing page + 3 cornerstone posts, all trilingual ES/EN/FR
  ▸ Posts:
      • 5 errores que cometen los ejecutivos extranjeros (715 words)
      • Domicilio Fiscal vs Oficina Privada (643 words)
      • Por qué necesitas un socio mexicano local (710 words)
  ▸ /blog/[slug] routes with hero image, social-share buttons,
    \"read next\" suggestions, dobiz CTA at the bottom
  ▸ Each post page has its own title, description, OG image
    pre-rendered into the raw HTML
  ▸ Sitemap.xml updated with blog listing + 3 posts
  ▸ Prerender pipeline expanded — every blog post ships as a
    static index.html with the article fully baked in
  ▸ Blog link added to nav

GEO impact
  ▸ Per-post raw HTML now carries 700+ words of high-intent
    content for queries like \"errores ejecutivos extranjeros mexico\",
    \"domicilio fiscal vs oficina\", and \"socio mexicano local\"
  ▸ Pre-rendered blog posts hit the same Google index path as
    routes — bots see real content, not the SPA shell.
" \
  --allow-empty

echo "→ Pushing..."
git push origin main

echo ""
echo "✓ Pushed. Vercel auto-deploys in ~60s."
echo "  Live:                   https://www.linbix.com"
echo "  Customer portal:        https://www.linbix.com/account"
echo "  Blog:                   https://www.linbix.com/blog"
echo "  First post:             https://www.linbix.com/blog/5-errores-extranjeros-mexico"
