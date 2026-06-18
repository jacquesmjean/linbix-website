/* ============================================================
   /api/stripe-webhook — handles Stripe events
   Verifies signature, then notifies Luc via Resend for:
     - checkout.session.completed (one-time payment success)
     - invoice.paid              (subscription renewal success)
     - invoice.payment_failed    (subscription renewal failed)
     - customer.subscription.deleted (cancellation)

   Env required:
     STRIPE_SECRET_KEY      — to construct event
     STRIPE_WEBHOOK_SECRET  — whsec_… (Stripe Dashboard → Webhooks → Signing secret)
     RESEND_API_KEY         — already wired
     RESEND_TO              — Luc's email (jluc@welt.com.mx)
     RESEND_FROM            — already wired
   ============================================================ */
import Stripe from "stripe";

// Vercel needs the raw body to verify the Stripe signature
export const config = {
  api: { bodyParser: false },
};

async function readRawBody(req){
  return await new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(typeof c === "string" ? Buffer.from(c) : c));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

async function notifyResend(subject, html){
  if(!process.env.RESEND_API_KEY) return;
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM || "Linbix <onboarding@resend.dev>",
        to: process.env.RESEND_TO || "jluc@welt.com.mx",
        subject,
        html,
      }),
    });
  } catch(err){ console.error("Resend notify failed", err); }
}

const fmtMxn = (cents) => "$" + (cents / 100).toLocaleString("es-MX", { minimumFractionDigits: 2 }) + " MXN";

export default async function handler(req, res){
  if(req.method !== "POST") return res.status(405).end();
  if(!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET){
    return res.status(503).send("Stripe not configured");
  }

  const sig = req.headers["stripe-signature"];
  const raw = await readRawBody(req);
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2024-12-18.acacia" });

  let event;
  try {
    event = stripe.webhooks.constructEvent(raw, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch(err){
    console.error("Stripe webhook signature failed", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch(event.type){
      case "checkout.session.completed": {
        const s = event.data.object;
        const sku = s.metadata?.sku || "unknown";
        const customer = s.customer_details?.email || "(no email)";
        const amount = s.amount_total != null ? fmtMxn(s.amount_total) : "(amount n/a)";
        const subject = `💸 Pago confirmado · ${sku} · ${amount}`;
        const html = `
          <div style="font-family:system-ui,sans-serif;max-width:560px">
            <h2 style="color:#1A130D">¡Pago recibido!</h2>
            <p><strong>SKU:</strong> ${sku}</p>
            <p><strong>Monto:</strong> ${amount}</p>
            <p><strong>Cliente:</strong> ${customer}</p>
            <p><strong>Modo:</strong> ${s.mode}</p>
            <p><a href="https://dashboard.stripe.com/payments/${s.payment_intent || s.id}">Ver en Stripe →</a></p>
          </div>`;
        await notifyResend(subject, html);
        break;
      }
      case "invoice.paid": {
        const inv = event.data.object;
        const amount = fmtMxn(inv.amount_paid);
        await notifyResend(
          `🔁 Renovación pagada · ${amount}`,
          `<p>Renovación de suscripción exitosa.</p>
           <p><strong>Cliente:</strong> ${inv.customer_email || "(n/a)"}</p>
           <p><strong>Monto:</strong> ${amount}</p>
           <p><strong>Línea:</strong> ${inv.lines?.data?.[0]?.description || "(n/a)"}</p>`
        );
        break;
      }
      case "invoice.payment_failed": {
        const inv = event.data.object;
        await notifyResend(
          `⚠️ Pago fallido · ${inv.customer_email || "(n/a)"}`,
          `<p>El cargo de renovación falló. Stripe reintenta automáticamente.</p>
           <p><strong>Próximo intento:</strong> ${inv.next_payment_attempt ? new Date(inv.next_payment_attempt*1000).toLocaleString("es-MX") : "(n/a)"}</p>
           <p><a href="https://dashboard.stripe.com/invoices/${inv.id}">Ver en Stripe →</a></p>`
        );
        break;
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object;
        await notifyResend(
          `🛑 Suscripción cancelada · ${sub.id}`,
          `<p>Una suscripción se canceló. Si el slot era Spotlight o Featured, libéralo en la página Comunidad.</p>`
        );
        break;
      }
      default:
        // Acknowledge but ignore
        break;
    }
    return res.status(200).json({ received: true });
  } catch(err){
    console.error("Webhook handler error", err);
    return res.status(500).json({ error: err.message });
  }
}
