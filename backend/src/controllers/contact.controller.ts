import ContactMessage from '../models/ContactMessage.ts';
import { escapeRegex } from '../utils/security.ts';
import { requireEmail, requireText } from '../utils/validation.ts';

const statuses = ['new', 'read', 'replied', 'archived'];

export async function createContactMessage(req, res) {
  const fullName = requireText(req.body?.fullName, 'Nom', { max: 120 });
  const email = requireEmail(req.body?.email, 'Adresse email');
  const subject = requireText(req.body?.subject, 'Sujet', { max: 120 });
  const message = requireText(req.body?.message, 'Message', { max: 3000 });
  const phone = String(req.body?.phone || '').trim().slice(0, 40);
  const created = await ContactMessage.create({
    fullName,
    email,
    phone,
    subject,
    message,
  });
  res.status(201).json({
    _id: created._id,
    status: created.status,
    createdAt: created.createdAt,
    message: 'Votre message a bien été transmis',
  });
}

export async function getContactMessages(req, res) {
  const { status, search, page = 1, limit = 30 } = req.query;
  const filter: Record<string, unknown> = {};
  if (status && status !== 'all') filter.status = status;
  if (search) {
    const value = escapeRegex(String(search).trim());
    filter.$or = ['fullName', 'email', 'phone', 'subject', 'message']
      .map((field) => ({ [field]: { $regex: value, $options: 'i' } }));
  }
  const currentPage = Math.max(Number(page) || 1, 1);
  const perPage = Math.min(Math.max(Number(limit) || 30, 1), 100);
  const [items, total, unread] = await Promise.all([
    ContactMessage.find(filter).sort({ createdAt: -1 }).skip((currentPage - 1) * perPage).limit(perPage),
    ContactMessage.countDocuments(filter),
    ContactMessage.countDocuments({ status: 'new' }),
  ]);
  res.json({ items, total, unread, page: currentPage, pages: Math.ceil(total / perPage) || 1 });
}

export async function getContactMessageById(req, res) {
  const item = await ContactMessage.findById(req.params.id);
  if (!item) return res.status(404).json({ message: 'Message introuvable' });
  if (item.status === 'new') {
    item.status = 'read';
    item.readAt = new Date();
    await item.save();
  }
  res.json(item);
}

export async function updateContactMessage(req, res) {
  const update: Record<string, unknown> = {};
  if (req.body.status !== undefined) {
    if (!statuses.includes(req.body.status)) return res.status(400).json({ message: 'Statut invalide' });
    update.status = req.body.status;
    if (req.body.status === 'read') update.readAt = new Date();
  }
  if (req.body.adminNote !== undefined) update.adminNote = String(req.body.adminNote || '').trim();
  const item = await ContactMessage.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
  if (!item) return res.status(404).json({ message: 'Message introuvable' });
  res.json(item);
}

export async function deleteContactMessage(req, res) {
  const item = await ContactMessage.findByIdAndDelete(req.params.id);
  if (!item) return res.status(404).json({ message: 'Message introuvable' });
  res.json({ message: 'Message supprimé', messageId: req.params.id });
}
