/* ============================================================
   /api/auth/logout — clear the session cookie
   ============================================================ */
const COOKIE_NAME = "linbix_auth";

export default async function handler(req, res){
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Set-Cookie",
    `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`);
  return res.status(200).json({ ok:true });
}
