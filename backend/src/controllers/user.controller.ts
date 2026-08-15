import User from '../models/User.ts';
import { escapeRegex } from '../utils/security.ts';
import { requireEmail, requireText } from '../utils/validation.ts';

function publicUserQuery() {
  return '-password';
}

function normalizeUserPayload(body: any = {}, isCreate = false) {
  const payload: any = {
    name: String(body.name || '').trim(),
    email: String(body.email || '').trim().toLowerCase(),
    role: ['client', 'admin'].includes(body.role) ? body.role : 'client',
    phone: String(body.phone || '').trim(),
    address: body.address || {},
  };
  if (isCreate || body.password) payload.password = String(body.password || '');
  return payload;
}

export async function getUsers(req, res) {
  const { search, role } = req.query;
  const filter: any = {};
  if (role && role !== 'all') filter.role = role;
  if (search) {
    const value = String(search).trim();
    filter.$or = [
      { name: { $regex: escapeRegex(value), $options: 'i' } },
      { email: { $regex: escapeRegex(value), $options: 'i' } },
      { phone: { $regex: escapeRegex(value), $options: 'i' } },
    ];
  }
  const users = await User.find(filter).select(publicUserQuery()).sort({ createdAt: -1 });
  res.json(users);
}

export async function createUser(req, res) {
  const payload = normalizeUserPayload(req.body, true);
  payload.name = requireText(payload.name, 'Nom', { max: 120 });
  payload.email = requireEmail(payload.email);
  payload.password = requireText(payload.password, 'Mot de passe', { min: 6, max: 128 });
  const exists = await User.findOne({ email: payload.email });
  if (exists) return res.status(409).json({ message: 'Email already exists' });
  const user = await User.create(payload);
  const created = await User.findById(user._id).select(publicUserQuery());
  res.status(201).json(created);
}

export async function updateUser(req, res) {
  const payload = normalizeUserPayload(req.body, false);
  payload.name = requireText(payload.name, 'Nom', { max: 120 });
  payload.email = requireEmail(payload.email);
  const exists = await User.findOne({ email: payload.email, _id: { $ne: req.params.id } });
  if (exists) return res.status(409).json({ message: 'Email already exists' });
  if (!payload.password) delete payload.password;
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  Object.assign(user, payload);
  await user.save();
  const updated = await User.findById(user._id).select(publicUserQuery());
  res.json(updated);
}

export async function updateUserRole(req, res) {
  if (!['client', 'admin'].includes(req.body.role)) return res.status(400).json({ message: 'Invalid role' });
  const user = await User.findByIdAndUpdate(req.params.id, { role: req.body.role }, { new: true, runValidators: true }).select(publicUserQuery());
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json(user);
}

export async function deleteUser(req, res) {
  if (String(req.user._id) === String(req.params.id)) return res.status(400).json({ message: 'You cannot delete your own account' });
  const user = await User.findByIdAndDelete(req.params.id).select(publicUserQuery());
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json({ message: 'User deleted successfully', user });
}
