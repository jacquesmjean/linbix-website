/* ============================================================
   /api/portal — Stripe Customer Portal session creator

   Customer enters their email on /account, we look up their Stripe
   Customer by email, create a Portal Session, return the URL. The
   browser redirects to Stripe's hosted portal where the customer
   can: cancel subscription, update payment method, view invoices,
   download receipts. No auth on our side — Stripe handles identity
   via its own session.

   Env required:
     STRIPE_SECRET_KEY     — already wired
     PUBLIC_URL            — already wired (return_url after portal close)
   ============================================================ */
import Stripe from "stripe";

const PUBLIC_URL = process.env.PUBLIC_URL || "https://www.linbix.com";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export default async function handler(req, res){
  for(const [k,v] of Object.entries(CORS)) res.setHeader(k, v);
  if(req.method === "OPTIONS") return res.status(204).end();
  if(req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  if(!process.env.STRIPE_SECRET_KEY){
    return res.status(503).json({ error: "Stripe not configured" });
  }

  let body = req.body;
  if(typeof body === "string"){ try { body = JSON.parse(body); } catch { body = {}; } }
  body = body || {};

  const email = (body.email || "").trim().toLowerCase();
  if(!email || !/^[^@]+@[^@]+\.[^@]+$/.test(email)){
    return res.status(400).json({ error: "Email inválido" });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2024-12-18.acacia" });

  try {
    // Lookup customer by email
    const customers = await stripe.customers.list({ email, limit: 1 });
    if(!customers.data.length){
      // Don't leak whether the email exists — generic message
      return res.status(404).json({
        error: "No encontramos una suscripción con ese correo. Si tienes una compra reciente, espera unos minutos y vuelve a intentar — o contáctanos.",
      });
    }
    const customer = customers.data[0];

    // Create portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: customer.id,
      return_url: `${PUBLIC_URL}/account?status=back`,
    });

    return res.status(200).json({ url: session.url });
  } catch(err){
    console.error("Stripe portal error", err);
    return res.status(500).json({ error: err.message || "Stripe error" });
  }
}
