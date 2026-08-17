import nodemailer from 'nodemailer';
import { renderNewOrderEmail } from '../templates/newOrderEmail.ts';

function money(value) {
  return `${Number(value || 0).toFixed(2)} DT`;
}

export const renderAdminOrderEmail = renderNewOrderEmail;

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
    html: renderAdminOrderEmail(order, `${String(process.env.CLIENT_URL || '').replace(/\/$/, '')}/admin/orders/${order._id || ''}`),
  });
  return { sent: true, messageId: info.messageId };
}
