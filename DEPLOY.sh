#!/usr/bin/env bash
# Ship: Aug 14 desayuno tuned to Luc's copy + Oficina Virtual base price bumped to $1,200
set -e
cd "$(dirname "$0")"
rm -f .git/index.lock || true

echo "→ git add..."
git add -A

echo "→ Committing..."
git commit -m "Update Aug 14 desayuno + bump Oficina Virtual base to \$1,200 MXN

EVENTS (/events) — three cards in the Próximos Eventos grid
  ▸ Desayuno Red Linbix (Aug 14) added as first card so it shows in the grid
    alongside Cena and Curso (Luc reported only 2 events visible on live)
  ▸ Desayuno also stays in the featured hero at top with countdown timer
  ▸ Time moved from 9 AM to 11 AM to match Luc's WhatsApp copy
  ▸ Perks tightened to match Luc's exact language
  ▸ Cena Networking Linbix — Aug 21, 7 PM, \$630 (unchanged)
  ▸ Curso de Inteligencia Artificial — Aug 29, 9 AM–3 PM, \$2,500 + IVA (unchanged)

SERVICES (/services) — Luc: bump base price
  ▸ Oficina Virtual: 'Desde \$800 MXN' → 'Desde \$1,200 MXN'
  ▸ Removed 'Virtual Millenial' \$800 tier
  ▸ 'Virtual Plus' (\$1,200) is now the entry tier with the merged feature set:
    mail handling + fiscal address + 6h meeting room + coworking access
    + personal phone number + call answering
  ▸ Higher tiers unchanged: Emprendedor \$1,800, Empresarial \$2,900

COMPARISON (/comparison)
  ▸ Linbix vs WeWork row for virtual office updated to \$1,200 MXN/mo
    (kept in sync with /services)
" \
  --allow-empty

echo "→ Pushing..."
git push origin main

echo ""
echo "✓ Pushed. Vercel auto-deploys in ~60s."
echo "  Verify at:"
echo "    https://www.linbix.com/events    (Desayuno + Cena + Curso as 3 cards)"
echo "    https://www.linbix.com/services  (Oficina Virtual 'Desde \$1,200 MXN')"
echo "    https://www.linbix.com/comparison (virtual office row shows \$1,200)"
