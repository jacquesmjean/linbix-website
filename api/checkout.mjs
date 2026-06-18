/* ============================================================
   /api/checkout — Linbix Stripe Checkout session creator
   Creates a hosted Stripe Checkout session for self-serve purchases.
   Catalog is server-authoritative — client only sends a SKU, never a price.

   Env required:
     STRIPE_SECRET_KEY     — sk_test_… (preview) / sk_live_… (production)
     STRIPE_WEBHOOK_SECRET — for /api/stripe-webhook (not used here)
     PUBLIC_URL            — https://www.linbix.com (default)

   Linbix Stripe is a Mexico merchant (Stripe MX). Currency = MXN.
   Prices include 16% IVA pre-baked into the unit_amount.
   ============================================================ */
import Stripe from "stripe";

const PUBLIC_URL = process.env.PUBLIC_URL || "https://www.linbix.com";

/* ------------------------------------------------------------ */
/* CATALOG — server-authoritative price book.                   */
/* All amounts in cents (MXN unless noted).                     */
/* IVA (16%) is pre-baked.                                       */
/* ------------------------------------------------------------ */
const withIVA = (mxn) => Math.round(mxn * 1.16 * 100); // pesos → cents incl. IVA

const CATALOG = {
  // ============ MEMBERSHIP ============
  "membresia-anual": {
    mode: "payment",
    line_items: [{
      price_data: {
        currency: "mxn",
        product_data: { name: "Membresía Linbix · Anual", description: "Acceso a la comunidad, 50% descuento en toda la infraestructura, eventos para miembros." },
        unit_amount: withIVA(600), // $696 MXN incl IVA
      },
      quantity: 1,
    }],
    label: "Membresía anual",
  },

  // ============ DAY PASS ============
  "coworking-day-pass": {
    mode: "payment",
    line_items: [{
      price_data: {
        currency: "mxn",
        product_data: { name: "Day Pass Coworking · Linbix", description: "Acceso de un día a coworking, café incluido, sin contrato." },
        unit_amount: withIVA(100), // $116 MXN incl IVA
      },
      quantity: 1,
    }],
    label: "Day pass",
  },

  // ============ COMUNIDAD — SPOTLIGHT ============
  "spotlight-mensual": {
    mode: "subscription",
    line_items: [{
      price_data: {
        currency: "mxn",
        product_data: { name: "Spotlight Comunidad · Mensual", description: "Tu logo en la página Comunidad por 30 días. Auto-renueva a menos que canceles." },
        unit_amount: withIVA(1000), // $1,160 MXN/mo
        recurring: { interval: "month" },
      },
      quantity: 1,
    }],
    label: "Spotlight mensual",
  },

  // ============ COMUNIDAD — FEATURED BUSINESS OF THE MONTH ============
  "featured-mensual": {
    mode: "subscription",
    line_items: [{
      price_data: {
        currency: "mxn",
        product_data: { name: "Empresa Destacada del Mes · Linbix", description: "Hero treatment en Comunidad, descripción expandida, video, link directo, mención en newsletter mensual." },
        unit_amount: withIVA(3000), // $3,480 MXN/mo
        recurring: { interval: "month" },
      },
      quantity: 1,
    }],
    label: "Empresa Destacada",
  },

  // ============ EVENTOS — SPONSORSHIP PACKAGES ============
  "sponsor-bronce-mensual": {
    mode: "subscription",
    line_items: [{
      price_data: {
        currency: "mxn",
        product_data: { name: "Patrocinio Bronce · Linbix Events", description: "Logo en página Eventos · 2 boletos generales/mes · mención en redes." },
        unit_amount: withIVA(2000),
        recurring: { interval: "month" },
      },
      quantity: 1,
    }],
    label: "Sponsorship Bronce",
  },

  "sponsor-plata-mensual": {
    mode: "subscription",
    line_items: [{
      price_data: {
        currency: "mxn",
        product_data: { name: "Patrocinio Plata · Linbix Events", description: "Bronce + banner físico en mixer mensual + stand + 4 boletos VIP/mes + lista de asistentes." },
        unit_amount: withIVA(5000),
        recurring: { interval: "month" },
      },
      quantity: 1,
    }],
    label: "Sponsorship Plata",
  },

  "sponsor-oro-mensual": {
    mode: "subscription",
    line_items: [{
      price_data: {
        currency: "mxn",
        product_data: { name: "Patrocinio Oro · Linbix Events", description: "Plata + 3-min pitch en tarima + Featured Spotlight incluido + 8 boletos VIP/mes + leads sectoriales + email blast." },
        unit_amount: withIVA(10000),
        recurring: { interval: "month" },
      },
      quantity: 1,
    }],
    label: "Sponsorship Oro",
  },

  // ============ EVENT TICKETS — one-time ============
  "evento-general": {
    mode: "payment",
    line_items: [{
      price_data: {
        currency: "mxn",
        product_data: { name: "Boleto General · Mixer Linbix", description: "Networking, cocktail de bienvenida, 2 horas de programa." },
        unit_amount: withIVA(300),
      },
      quantity: 1,
    }],
    label: "Boleto General",
  },

  "evento-vip": {
    mode: "payment",
    line_items: [{
      price_data: {
        currency: "mxn",
        product_data: { name: "Boleto VIP · Mixer Linbix", description: "Acceso pre-evento, mesa reservada, bebidas premium incluidas." },
        unit_amount: withIVA(800),
      },
      quantity: 1,
    }],
    label: "Boleto VIP",
  },
};

/* ------------------------------------------------------------ */
/* Handler                                                       */
/* ------------------------------------------------------------ */
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export default async function handler(req, res){
  // CORS preflight
  for(const [k,v] of Object.entries(CORS)) res.setHeader(k, v);
  if(req.method === "OPTIONS") return res.status(204).end();
  if(req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  if(!process.env.STRIPE_SECRET_KEY){
    return res.status(503).json({ error: "Stripe not configured. Add STRIPE_SECRET_KEY to Vercel env." });
  }

  let body = req.body;
  if(typeof body === "string"){ try { body = JSON.parse(body); } catch { body = {}; } }
  body = body || {};

  const { sku, email, locale } = body;
  if(!sku || !CATALOG[sku]){
    return res.status(400).json({ error: `Unknown SKU: ${sku}` });
  }

  const item = CATALOG[sku];
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2024-12-18.acacia" });

  const params = {
    mode: item.mode,
    line_items: item.line_items,
    success_url: `${PUBLIC_URL}/checkout/success?sku=${encodeURIComponent(sku)}&sid={CHECKOUT_SESSION_ID}`,
    cancel_url:  `${PUBLIC_URL}/checkout/cancel?sku=${encodeURIComponent(sku)}`,
    locale: ({"es":"es-419","en":"en","fr":"fr"}[locale] || "auto"),
    metadata: { sku, source: "linbix.com" },
    allow_promotion_codes: true,
    billing_address_collection: "required",
  };
  if(email) params.customer_email = email;

  // Payment-method coverage — Mexico Stripe automatic detection
  if(item.mode === "payment"){
    // One-time: cards + OXXO + SPEI (OXXO needs explicit enable)
    params.payment_method_types = ["card","oxxo"];
  } else {
    // Subscriptions: cards only (OXXO doesn't support recurring)
    params.payment_method_types = ["card"];
  }

  try{
    const session = await stripe.checkout.sessions.create(params);
    return res.status(200).json({ url: session.url, sessionId: session.id });
  }catch(err){
    console.error("Stripe checkout error", err);
    return res.status(500).json({ error: err.message || "Stripe error" });
  }
}
