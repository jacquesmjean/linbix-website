/* ============================================================
   /api/auth/login — Linbix admin login (Luc only)
   Verifies email + password against env vars, issues an
   HMAC-signed HttpOnly session cookie valid for 7 days.
   ============================================================ */
import crypto from "node:crypto";

const COOKIE_NAME = "linbix_auth";
const MAX_AGE_SEC = 7 * 24 * 60 * 60; // 7 days

function signToken(payload, secret){
  const data = JSON.stringify(payload);
  const sig  = crypto.createHmac("sha256", secret).update(data).digest("base64url");
  return Buffer.from(data).toString("base64url") + "." + sig;
}

function eqConst(a, b){
  if(!a || !b || a.length !== b.length) return false;
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

export default async function handler(req, res){
  res.setHeader("Cache-Control", "no-store");
  if(req.method !== "POST") return res.status(405).json({ ok:false, error:"Method not allowed" });

  let data = req.body;
  if(typeof data === "string"){ try{ data = JSON.parse(data); }catch{ data = {}; } }
  data = data || {};

  const email    = (data.email || "").trim().toLowerCase();
  const password = data.password || "";

  const envEmail    = (process.env.AUTH_EMAIL || "").trim().toLowerCase();
  const envPassword = process.env.AUTH_PASSWORD || "";
  const secret      = process.env.SESSION_SECRET || "";

  if(!envEmail || !envPassword || !secret){
    return res.status(500).json({ ok:false, error:"Server not configured" });
  }

  // small artificial delay to deter brute-force timing
  await new Promise(r => setTimeout(r, 300 + Math.random() * 200));

  if(!eqConst(email, envEmail) || !eqConst(password, envPassword)){
    return res.status(401).json({ ok:false, error:"Email o contraseña incorrectos" });
  }

  const token = signToken({
    sub: email,
    exp: Date.now() + MAX_AGE_SEC * 1000,
    iat: Date.now(),
  }, secret);

  res.setHeader("Set-Cookie",
    `${COOKIE_NAME}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${MAX_AGE_SEC}`);

  return res.status(200).json({ ok:true, email });
}
