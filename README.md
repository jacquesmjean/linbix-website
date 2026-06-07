# Linbix Business Place — Website

Trilingual marketing site (Spanish · English · French) for Linbix Business Place in Guadalajara, México. Static, self-contained, zero-build. Designed and built by [TechFides](https://techfides.com).

## What's inside

- `index.html` — the entire site in one file: trilingual content, image-led service cards, animated hero, scroll reveals, and an embedded lead-capture + routing demo.
- `vercel.json` — production headers (HSTS, CSP-equivalent), cache rules.
- `package.json` — metadata for tooling and the Vercel dashboard.

## Local preview

Open `index.html` in any browser. No build step. No dependencies.

## Deploy to Vercel

Two paths:

**Vercel CLI — fastest:**

```bash
npx vercel --prod
```

Follow the prompts; Vercel auto-detects the static site.

**GitHub + Vercel dashboard:**

```bash
git init
git add .
git commit -m "Initial commit: Linbix website (trilingual + demo automation)"
gh repo create linbix-website --public --source=. --push
```

Then on [vercel.com/new](https://vercel.com/new), import the `linbix-website` repo. Every push to `main` redeploys automatically.

## Custom domain

Once deployed, point `linbix.com` to Vercel in the project's **Domains** settings. Vercel issues the SSL certificate automatically.

## Contact

TechFides · [techfides.com](https://techfides.com) · engage@techfides.com
