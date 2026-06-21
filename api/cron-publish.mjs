/* ============================================================
   /api/cron-publish — Weekly blog auto-publish

   Vercel Cron pings this endpoint every Monday at 16:00 UTC
   (10:00 Mexico City). It POSTs to Vercel's Deploy Hook, which
   triggers a fresh build. The build's prerender step then
   includes any blog posts whose `date` field is now <= today.

   Cron schedule lives in vercel.json. Vercel verifies the
   request comes from its cron system via x-vercel-cron header
   (or a manual call with the right Authorization).

   Env required:
     VERCEL_DEPLOY_HOOK_URL — paste from Vercel project settings
                              (Settings → Git → Deploy Hooks).
   Optional:
     CRON_SECRET           — if set, requests must include
                              Authorization: Bearer <value>
   ============================================================ */
export default async function handler(req, res){
  // Restrict to GET or POST (Vercel Cron sends GET)
  if(req.method !== "GET" && req.method !== "POST"){
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Optional shared-secret check for manual triggers
  if(process.env.CRON_SECRET){
    const auth = req.headers.authorization || "";
    if(auth !== `Bearer ${process.env.CRON_SECRET}`){
      // Allow if from Vercel Cron without the bearer (Vercel sets x-vercel-cron)
      if(!req.headers["x-vercel-cron"]){
        return res.status(401).json({ error: "Unauthorized" });
      }
    }
  }

  if(!process.env.VERCEL_DEPLOY_HOOK_URL){
    return res.status(503).json({ error: "VERCEL_DEPLOY_HOOK_URL not set" });
  }

  try {
    const r = await fetch(process.env.VERCEL_DEPLOY_HOOK_URL, { method: "POST" });
    const body = await r.text();
    return res.status(200).json({
      triggered: true,
      vercelStatus: r.status,
      vercelResponse: body.slice(0, 200),
      ts: new Date().toISOString(),
    });
  } catch(err){
    console.error("cron-publish error", err);
    return res.status(500).json({ error: err.message });
  }
}
