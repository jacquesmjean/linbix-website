#!/usr/bin/env bash
# Ship: Luc's WhatsApp corrections — round 1 (the clear ones)
set -e
cd "$(dirname "$0")"
rm -f .git/index.lock || true

echo "→ git add..."
git add -A

echo "→ Committing..."
git commit -m "Luc corrections round 1: favicon, CTA rename, honest stats, no timeline lies

CHANGES (per Luc's WhatsApp punch list)
  ▸ Browser tab logo — added Linbix favicon (32/192/512 + .ico + manifest)
  ▸ CTA rename — 'Hablar con Luc' → 'Hablar con asesor Linbix' (3 places)
  ▸ Removed (Día 1–3) from Onboarding step label
  ▸ Removed (Día 4–14) from Constitución step label
  ▸ Replaced the '14 Días al primer cliente' stat with
    '12 Años acompañando empresas' — matches the truth (per Luc:
    realistic timeline is ~3 months, not 14 days)

HELD FOR LUC'S INPUT (round 2)
  ▸ Hero rewrite: 'No vendemos un simple servicio. Vendemos la entrada...'
  ▸ Pain-point addition: 'Tu contador en el extranjero no sabe nada'
  ▸ \$1,000 USD/año offer copy — softer promises
  ▸ Spotlight headline: 'Una sola marca. Un mes completo. La comunidad entera.'
" \
  --allow-empty

echo "→ Pushing..."
git push origin main

echo ""
echo "✓ Pushed. Vercel auto-deploys in ~60s."
echo "  Verify at:"
echo "    https://www.linbix.com/                    (favicon in tab + Hablar con asesor Linbix CTA)"
echo "    https://www.linbix.com/dobiz               (Onboarding/Constitución without day ranges)"
