/* ============================================================
   /api/auth/check — verify session cookie
   Returns { ok:true, email } if cookie is valid HMAC + not expired
   Returns 401 otherwise
   ============================================================ */
import crypto from "node:crypto";

const COOKIE_NAME = "linbix_auth";

function parseCookies(header){
  const out = {};
  (header || "").split(/;\s*/).forEach(p => {
    const i = p.indexOf("=");
    if(i < 0) return;
    out[p.slice(0,i).trim()] = decodeURIComponent(p.slice(i+1));
  });
  return out;
}

function verifyToken(token, secret){
  if(!token || typeof token !== "string") return null;
  const dot = token.lastIndexOf(".");
  if(dot < 0) return null;
  const b64data = token.slice(0, dot);
  const sig     = token.slice(dot + 1);
  let data;
  try { data = Buffer.from(b64data, "base64url").toString("utf-8"); } catch { return null; }
  const expected = crypto.createHmac("sha256", secret).update(data).digest("base64url");
  // constant-time compare
  if(sig.length !== expected.length) return null;
  if(!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  let payload;
  try { payload = JSON.parse(data); } catch { return null; }
  if(payload.exp && Date.now() > payload.exp) return null;
  return payload;
}

export default async function handler(req, res){
  res.setHeader("Cache-Control", "no-store");
  const secret = process.env.SESSION_SECRET || "";
  if(!secret) return res.status(500).json({ ok:false });
  const cookies = parseCookies(req.headers.cookie);
  const payload = verifyToken(cookies[COOKIE_NAME], secret);
  if(!payload) return res.status(401).json({ ok:false });
  return res.status(200).json({ ok:true, email: payload.sub, exp: payload.exp });
}
