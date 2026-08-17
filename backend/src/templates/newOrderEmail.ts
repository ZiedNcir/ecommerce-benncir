import { escapeHtml } from '../utils/html.ts';

const money = (value) => `${Number(value || 0).toFixed(2)} DT`;

export function renderNewOrderEmail(order, dashboardUrl = '') {
  const customer = order.customer || {};
  const deliveryFee = Number(order.delivery?.fee ?? order.deliveryFee ?? 8);
  const rows = (order.items || []).map((item) => `
    <tr>
      <td style="padding:14px 10px;border-bottom:1px solid #eceff3;color:#182230;font-weight:700">${escapeHtml(item.name)}</td>
      <td style="padding:14px 10px;border-bottom:1px solid #eceff3;text-align:center;color:#667085">${escapeHtml(item.quantity)}</td>
      <td style="padding:14px 10px;border-bottom:1px solid #eceff3;text-align:right;color:#182230;font-weight:700;white-space:nowrap">${money(Number(item.price || 0) * Number(item.quantity || 0))}</td>
    </tr>`).join('');

  const action = dashboardUrl ? `<a href="${escapeHtml(dashboardUrl)}" style="display:inline-block;padding:13px 22px;border-radius:10px;background:#d7a92b;color:#17130a;text-decoration:none;font-weight:800">Ouvrir la commande</a>` : '';

  return `<!doctype html>
  <html lang="fr"><body style="margin:0;padding:0;background:#f4f6f8;font-family:Arial,Helvetica,sans-serif;color:#182230">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f6f8;padding:28px 12px"><tr><td align="center">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:680px;background:#ffffff;border:1px solid #e6e9ee;border-radius:18px;overflow:hidden">
        <tr><td style="padding:26px 30px;background:#0c1119;color:#ffffff">
          <div style="font-size:22px;font-weight:900;letter-spacing:-.5px">BÊN NCÎR <span style="color:#e2b53b">COMMERCE</span></div>
          <div style="margin-top:7px;color:#b8c0cc;font-size:13px">Notification automatique de commande</div>
        </td></tr>
        <tr><td style="padding:30px">
          <div style="display:inline-block;padding:7px 11px;border-radius:999px;background:#fff5d6;color:#795800;font-size:12px;font-weight:800">NOUVELLE COMMANDE</div>
          <h1 style="margin:16px 0 8px;font-size:28px;line-height:1.2">${escapeHtml(order.orderNumber)}</h1>
          <p style="margin:0 0 24px;color:#667085;line-height:1.6">Une nouvelle commande vient d’être enregistrée et nécessite votre attention.</p>

          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom:24px;background:#f8fafb;border:1px solid #e9edf1;border-radius:12px">
            <tr><td style="padding:18px;line-height:1.7">
              <strong style="font-size:16px">${escapeHtml(customer.fullName || 'Client')}</strong><br>
              <span style="color:#667085">${escapeHtml(customer.phone || '—')} · ${escapeHtml(customer.email || '—')}</span><br>
              <span style="color:#667085">${escapeHtml(customer.address || '—')}, ${escapeHtml(customer.city || '—')} ${escapeHtml(customer.postalCode || '')}</span>
            </td></tr>
          </table>

          <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin-bottom:22px">
            <thead><tr><th align="left" style="padding:10px;color:#667085;font-size:12px;text-transform:uppercase">Produit</th><th style="padding:10px;color:#667085;font-size:12px;text-transform:uppercase">Qté</th><th align="right" style="padding:10px;color:#667085;font-size:12px;text-transform:uppercase">Total</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>

          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom:26px;background:#111827;color:#ffffff;border-radius:12px">
            <tr><td style="padding:18px">Sous-total</td><td align="right" style="padding:18px;font-weight:700">${money(order.subtotal)}</td></tr>
            <tr><td style="padding:0 18px 18px;color:#c8ced8">Livraison à domicile</td><td align="right" style="padding:0 18px 18px;color:#c8ced8">${money(deliveryFee)}</td></tr>
            <tr><td style="padding:18px;border-top:1px solid #344054;font-size:18px;font-weight:800">Total à encaisser</td><td align="right" style="padding:18px;border-top:1px solid #344054;color:#f2c84b;font-size:22px;font-weight:900">${money(order.total)}</td></tr>
          </table>

          ${action}
          <p style="margin:24px 0 0;color:#98a2b3;font-size:12px;line-height:1.6">Paiement à la livraison. Cet email a été envoyé automatiquement à benncircommerce@gmail.com.</p>
        </td></tr>
      </table>
    </td></tr></table>
  </body></html>`;
}
