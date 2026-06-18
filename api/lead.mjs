/* ============================================================
   /api/lead — Linbix lead capture serverless function (Vercel)
   Receives form submissions from the site, runs the lead
   pipeline server-side, emails Luc at RESEND_TO via Resend.

   TODO BEFORE STRIPE COMMERCE LAUNCH:
   ▸ Add rate limiting (Upstash Redis or Vercel KV).
     Currently a script could blast 10K submissions and burn Resend
     quota / flood Luc's inbox. Acceptable for beta lead-capture
     phase, NOT acceptable once /api/checkout and /api/stripe-webhook
     accept payment intents on the same surface.
   ▸ Suggested limit: 5 requests per IP per 10 minutes (form fills are
     bursty but never legitimate at >5/min).
   ============================================================ */

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const SERVICE_LABELS = {
  "oficina-virtual":    "Oficina Virtual",
  "coworking":          "Co-Working",
  "executive-office":   "Executive Office",
  "domicilio-comercial":"Domicilio Comercial",
  "sala-de-juntas":     "Sala de Juntas",
  "terraza":            "Terraza",
  "business-card":      "Linbix Business Card",
  "membresia":          "Membresía",
  "do-business-mx":     "Quiero Hacer Negocios en México ($1,000 USD/año)",
  "hacer-negocios":     "Hacer Negocios en México (consulta)",
  "contacto":           "Contacto general",
};
const SERVICE_VALUE = {
  "do-business-mx":10, "oficina-virtual":9, "executive-office":8, "coworking":7,
  "terraza":6, "domicilio-comercial":5, "membresia":4, "sala-de-juntas":3,
  "business-card":2, "hacer-negocios":10, "contacto":5,
};
const SERVICE_QUEUE = {
  "do-business-mx":"intl", "hacer-negocios":"intl", "sala-de-juntas":"ops",
  "terraza":"ops", "oficina-virtual":"ventas", "coworking":"ventas",
  "executive-office":"ventas", "domicilio-comercial":"ventas",
  "business-card":"ventas", "membresia":"ventas", "contacto":"ventas",
};
const INTL_COUNTRIES = ["usa","united states","canada","france","france","brasil","brazil","españa","spain","portugal","belgium","belgique","suisse","switzerland","argentina","colombia","chile","peru","perú"];

function scoreLead(d, svc){
  let s = 30 + (SERVICE_VALUE[svc] || 5) * 5;
  const isIntl = svc === "do-business-mx" || svc === "hacer-negocios"
    || INTL_COUNTRIES.includes((d.country||"").toLowerCase().trim());
  if(isIntl)                 s += 18;
  if(d.phone || d.whatsapp)  s += 6;
  if(d.company)              s += 3;
  if(d.message && d.message.length>40) s += 4;
  if(Array.isArray(d.interestedServices) && d.interestedServices.length>2) s += 4;
  if(d.promote || d.targets) s += 3;
  return { score: Math.min(99, s), isIntl };
}

function urgencyTier(score, isIntl){
  if(score >= 80 || isIntl) return { tier:"HOT",   color:"#E85642", action:"Llamar dentro de 15 minutos. Lead caliente." };
  if(score >= 60)            return { tier:"WARM",  color:"#F6863B", action:"Contactar hoy mismo por WhatsApp o email." };
  return                      { tier:"COOL",  color:"#6B6258", action:"Responder dentro de 24 horas." };
}

function fmtRow(label, val){
  if(!val) return "";
  return `<tr><td style="padding:6px 10px;color:#6B6258;font-size:13px;white-space:nowrap">${label}</td><td style="padding:6px 10px;color:#1A130D;font-size:14px;font-weight:600">${val}</td></tr>`;
}
function fmtList(arr){
  if(!arr || !arr.length) return "";
  return "<ul style='margin:6px 0 0;padding-left:20px;font-size:14px;color:#1A130D'>" + arr.map(x=>`<li>${x}</li>`).join("") + "</ul>";
}

function emailHTML(lead, u, q){
  const queueLabel = {intl:"Internacional", ventas:"Ventas", ops:"Operaciones"}[lead.queue] || lead.queue;
  return `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#F4EFE9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
  <div style="max-width:620px;margin:0 auto;padding:24px 16px">
    <div style="background:#fff;border-radius:16px;overflow:hidden;border:1px solid #E7DFD5;box-shadow:0 8px 24px rgba(26,19,13,.08)">

      <div style="background:linear-gradient(135deg,${u.color},#1A130D);padding:22px 28px;color:#fff">
        <div style="font-size:11px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;opacity:.85">${u.tier} · Score ${lead.score} · Cola: ${queueLabel}</div>
        <div style="font-size:22px;font-weight:700;margin-top:6px">Nuevo lead — ${lead.name}</div>
        <div style="font-size:14px;opacity:.85;margin-top:4px">${lead.serviceName}</div>
      </div>

      <div style="padding:20px 24px;border-bottom:1px solid #F4EFE9;background:#FCFAF7">
        <div style="font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#F6863B;margin-bottom:6px">Acción recomendada</div>
        <div style="font-size:15px;color:#1A130D;font-weight:600;line-height:1.5">${u.action}</div>
      </div>

      <div style="padding:18px 24px">
        <div style="font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#6B6258;margin-bottom:10px">Contacto</div>
        <table style="width:100%;border-collapse:collapse;font-size:14px">
          ${fmtRow("Nombre", lead.name)}
          ${fmtRow("Email", `<a href="mailto:${lead.email}" style="color:#F6863B;text-decoration:none">${lead.email}</a>`)}
          ${fmtRow("Teléfono", lead.phone)}
          ${fmtRow("WhatsApp", lead.whatsapp ? `<a href="https://wa.me/${lead.whatsapp.replace(/[^0-9]/g,'')}" style="color:#F6863B;text-decoration:none">${lead.whatsapp}</a>`: "")}
          ${fmtRow("Empresa", lead.company)}
          ${fmtRow("País", lead.country)}
          ${fmtRow("Sitio web", lead.website ? `<a href="${lead.website}" style="color:#F6863B;text-decoration:none">${lead.website}</a>`: "")}
          ${fmtRow("Dirección", lead.address)}
        </table>
      </div>

      ${lead.promote || lead.targets ? `
      <div style="padding:0 24px 18px">
        <div style="font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#6B6258;margin-bottom:10px">Negocio</div>
        ${lead.promote ? `<div style="font-size:13px;color:#6B6258;margin-bottom:4px">Productos/servicios a promover</div><div style="font-size:14px;color:#1A130D;background:#F4EFE9;padding:10px 14px;border-radius:8px;margin-bottom:12px">${lead.promote}</div>` : ""}
        ${lead.targets ? `<div style="font-size:13px;color:#6B6258;margin-bottom:4px">Clientes potenciales en MX</div><div style="font-size:14px;color:#1A130D;background:#F4EFE9;padding:10px 14px;border-radius:8px">${lead.targets}</div>`:""}
      </div>` : ""}

      ${lead.interestedServices && lead.interestedServices.length ? `
      <div style="padding:0 24px 18px">
        <div style="font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#6B6258;margin-bottom:10px">Servicios de interés</div>
        ${fmtList(lead.interestedServices)}
      </div>`:""}

      ${lead.message ? `
      <div style="padding:0 24px 18px">
        <div style="font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#6B6258;margin-bottom:10px">Mensaje</div>
        <div style="font-size:14px;color:#1A130D;background:#F4EFE9;padding:10px 14px;border-radius:8px;line-height:1.55">${lead.message}</div>
      </div>`:""}

      <div style="padding:18px 24px;background:#FCFAF7;border-top:1px solid #F4EFE9;display:flex;gap:8px;flex-wrap:wrap">
        <a href="mailto:${lead.email}?subject=Linbix%20—%20${encodeURIComponent(lead.serviceName)}" style="display:inline-block;padding:10px 18px;background:#1A130D;color:#fff;text-decoration:none;border-radius:999px;font-size:13px;font-weight:700">Responder por email →</a>
        ${lead.whatsapp || lead.phone ? `<a href="https://wa.me/${(lead.whatsapp||lead.phone).replace(/[^0-9]/g,'')}" style="display:inline-block;padding:10px 18px;background:#25D366;color:#fff;text-decoration:none;border-radius:999px;font-size:13px;font-weight:700">WhatsApp →</a>`:""}
      </div>

      <div style="padding:14px 24px;background:#F4EFE9;font-size:11px;color:#6B6258;letter-spacing:.06em;text-transform:uppercase">
        Linbix · Lead ${lead.id} · Fuente: ${lead.source} · Locale: ${lead.locale} · ${new Date(lead.ts).toLocaleString("es-MX",{timeZone:"America/Mexico_City"})}
      </div>
    </div>
  </div>
  </body></html>`;
}

function emailSubject(lead, u){
  const tag = u.tier === "HOT" ? "🔥 HOT" : u.tier === "WARM" ? "⚡ WARM" : "•";
  return `${tag} ${lead.name} — ${lead.serviceName} (score ${lead.score})`;
}

export default async function handler(req, res){
  Object.entries(CORS).forEach(([k,v]) => res.setHeader(k, v));
  if(req.method === "OPTIONS") return res.status(204).end();
  if(req.method !== "POST")    return res.status(405).json({ ok:false, error:"Method not allowed" });

  let data = req.body;
  if(typeof data === "string"){ try{ data = JSON.parse(data); }catch{ data = {}; } }
  data = data || {};

  // basic validation
  if(!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)){
    return res.status(400).json({ ok:false, error:"Email inválido" });
  }
  if(!data.name || data.name.length < 2){
    return res.status(400).json({ ok:false, error:"Nombre requerido" });
  }

  const svc = data.service || "contacto";
  const { score, isIntl } = scoreLead(data, svc);
  const queue = SERVICE_QUEUE[svc] || (isIntl ? "intl" : "ventas");
  const u = urgencyTier(score, isIntl);

  const lead = {
    id: "LX-" + Date.now().toString(36).toUpperCase(),
    name: data.name, email: data.email, phone: data.phone || "",
    whatsapp: data.whatsapp || "", company: data.company || "",
    country: data.country || "", website: data.website || "",
    address: data.address || "", message: data.message || "",
    promote: data.promote || "", targets: data.targets || "",
    interestedServices: Array.isArray(data.interestedServices) ? data.interestedServices : (data["svc[]"] || []),
    service: svc, serviceName: SERVICE_LABELS[svc] || svc,
    queue, score, locale: (data.locale || "ES").toUpperCase(),
    source: data.source || "Linbix website",
    ts: Date.now(),
  };

  const subject = emailSubject(lead, u);
  const html    = emailHTML(lead, u, queue);

  try{
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type":  "application/json",
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM || "Linbix <leads@techfides.com>",
        to: [process.env.RESEND_TO || "jluc@welt.com.mx"],
        reply_to: lead.email,
        subject,
        html,
      }),
    });
    const out = await r.json().catch(()=>({}));
    if(!r.ok){
      console.error("Resend error", r.status, out);
      return res.status(502).json({ ok:false, error:"Email service error", detail: out });
    }
    return res.status(200).json({ ok:true, lead: { id:lead.id, score:lead.score, queue:lead.queue, urgency:u.tier } });
  }catch(err){
    console.error("Send failure", err);
    return res.status(500).json({ ok:false, error: err.message });
  }
}
