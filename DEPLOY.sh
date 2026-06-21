#!/usr/bin/env bash
# Ship header cleanup
set -e
cd "$(dirname "$0")"
rm -f .git/index.lock || true

echo "→ git add..."
git add .

echo "→ Committing..."
git commit -m "Header nav: from 7 items down to 5 + CTA — refined minimalism

Applied UI/UX Pro Max nav rules + frontend-design restraint.

CHANGES
  ▸ Old menu (7 items + lang + chat): About, Services▾, Hacer Negocios,
    Comunidad, Partners, Eventos, Blog, Contact
  ▸ New menu (5 items + CTA + lang): Servicios▾, Hacer Negocios,
    Comunidad, Eventos, Recursos▾, [Reservar tour]

  Recursos▾ absorbs the lower-utility items in one dropdown:
    • Blog
    • FAQ
    • Linbix vs WeWork (Comparativa)
    • Sobre Linbix (About)
    • Socios estratégicos (Partners)

VISUAL TREATMENT (refined-minimalism)
  ▸ Typographic nav — no chrome on inactive items
  ▸ Active state = animated gold underline (no boxes, no rounded rects)
  ▸ Hover lifts text to white + reveals the gold underline
  ▸ Dropdowns: scale+translate entry, premium card shadow, gold left-rail
    accent on Recursos rows
  ▸ Single primary CTA in the header: 'Reservar tour' as a gold gradient
    pill — only chrome'd element, single source of action per UX rule
  ▸ Active-section logic: Servicios highlights on /services or any /svc:*,
    Recursos highlights on blog/faq/about/partners/comparison

MOBILE PARITY
  ▸ Same 5-group structure in the slide drawer
  ▸ CTA at the bottom is now 'Reservar tour' (was 'Habla con Linbix')
  ▸ Recursos collapses into an accordion group like Servicios
" \
  --allow-empty

echo "→ Pushing..."
git push origin main

echo ""
echo "✓ Pushed. Vercel auto-deploys in ~60s."
