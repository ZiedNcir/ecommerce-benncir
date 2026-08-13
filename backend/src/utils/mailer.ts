import nodemailer from 'nodemailer';

function money(value) {
  return `${Number(value || 0).toFixed(2)} DT`;
}

export function renderAdminOrderEmail(order) {
  const rows = order.items.map((item) => `<tr><td style="padding:8px;border-bottom:1px solid #eee">${item.name}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:center">${item.quantity}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:right">${money(item.price)}</td></tr>`).join('');
  return `
    <div style="font-family:Arial,sans-serif;color:#111827;max-width:720px;margin:auto">
      <h1 style="margin:0 0 8px">Nouvelle commande ${order.orderNumber}</h1>
      <p style="color:#667085">Une commande vient d'être confirmée sur BÊN NCÎR Commerce.</p>
      <h2>Client</h2>
      <p><b>${order.customer.fullName}</b><br>${order.customer.phone}<br>${order.customer.email}<br>${order.customer.address}, ${order.customer.city}</p>
      <h2>Articles</h2>
      <table style="width:100%;border-collapse:collapse"><thead><tr><th align="left">Produit</th><th>Qté</th><th align="right">Prix</th></tr></thead><tbody>${rows}</tbody></table>
      <p style="font-size:18px"><b>Total : ${money(order.total)}</b></p>
      <p>Livraison : domicile, 7 DT<br>Paiement : à la livraison</p>
    </div>`;
}

export async function sendAdminOrderEmail(order) {
  if (!process.env.SMTP_HOST || !process.env.ADMIN_ORDER_EMAIL) {
    return { skipped: true, reason: 'SMTP_HOST or ADMIN_ORDER_EMAIL missing' };
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
  });

  const info = await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER || 'BÊN NCÎR Commerce <no-reply@bencir.local>',
    to: process.env.ADMIN_ORDER_EMAIL,
    subject: `Nouvelle commande ${order.orderNumber} - ${money(order.total)}`,
    html: renderAdminOrderEmail(order),
  });
  return { sent: true, messageId: info.messageId };
}
