#!/usr/bin/env bash
# One-shot deploy — Events revenue engine + media wall + eyebrow fix
set -e
cd "$(dirname "$0")"

# Clear any stale lock
rm -f .git/index.lock || true

echo "→ Adding files..."
git add index.html public/media

echo "→ Committing..."
git commit -m "Events revenue engine + Vive Linbix media wall + real photos & video

- Events page transformed into revenue engine:
  • Featured event hero with live countdown timer (June 25 Mixer)
  • Sponsor marquee + 3 sponsorship packages (Bronce \$2k / Plata \$5k / Oro \$10k MXN/mo)
  • Monthly Spotlight slot — auto-expires unless renewed
  • Upcoming events grid with ticket tiers (General / VIP / Members)
  • Host-your-event CTA, past events gallery
  • All wired to /api/lead with specific source tags

- Vive Linbix media wall:
  • Continuous auto-scrolling marquee of photos + autoplay muted videos
  • 12 curated photos + 8 curated videos from real Linbix shoot
  • Lightbox click-to-expand
  • Luxury frame: brass hairline + multi-layer shadow + polished inner ring
  • Slotted on Home (between marquee & About) and Events (compact)

- Real brand photos replace Wix placeholders site-wide
  (About split, Do-Business teaser, all event cards, past events)

- Eyebrow fix: 'Automation · Live demo' → 'Behind every form'
  (executive tone match)
"

echo "→ Pushing..."
git push origin main

echo ""
echo "✓ Pushed. Vercel will auto-deploy in ~60 seconds."
echo "  Watch: https://vercel.com/jacquesmjeans-projects"
echo "  Live:  https://www.linbix.com"
