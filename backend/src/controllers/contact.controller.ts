import ContactMessage from '../models/ContactMessage.ts';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const statuses = ['new', 'read', 'replied', 'archived'];

export async function createContactMessage(req, res) {
  const { fullName, email, phone = '', subject, message } = req.body || {};
  if (![fullName, email, subject, message].every((value) => String(value || '').trim())) {
    return res.status(400).json({ message: 'Nom, email, sujet et message sont obligatoires' });
  }
  if (!emailPattern.test(String(email).trim())) {
    return res.status(400).json({ message: 'Adresse email invalide' });
  }
  const created = await ContactMessage.create({
    fullName: String(fullName).trim(),
    email: String(email).trim().toLowerCase(),
    phone: String(phone).trim(),
    subject: String(subject).trim(),
    message: String(message).trim(),
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
    const value = String(search).trim();
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

