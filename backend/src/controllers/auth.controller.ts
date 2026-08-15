import User from '../models/User.ts';
import { generateToken } from '../utils/generateToken.ts';
import { requireEmail, requireText } from '../utils/validation.ts';

function publicUser(user) {
  return { _id: user._id, name: user.name, email: user.email, role: user.role, createdAt: user.createdAt };
}

export async function register(req, res) {
  const name = requireText(req.body?.name, 'Nom', { max: 120 });
  const email = requireEmail(req.body?.email);
  const password = requireText(req.body?.password, 'Mot de passe', { min: 6, max: 128 });
  const exists = await User.findOne({ email });
  if (exists) return res.status(409).json({ message: 'Email already exists' });
  const user = await User.create({ name, email, password, role: 'client' });
  res.status(201).json({ user: publicUser(user), token: generateToken(user._id) });
}

export async function createAdmin(req, res) {
  const name = requireText(req.body?.name, 'Nom', { max: 120 });
  const email = requireEmail(req.body?.email);
  const password = requireText(req.body?.password, 'Mot de passe', { min: 6, max: 128 });
  const exists = await User.findOne({ email });
  if (exists) return res.status(409).json({ message: 'Email already exists' });
  const user = await User.create({ name, email, password, role: 'admin' });
  res.status(201).json({ user: publicUser(user) });
}

export async function setupFirstAdmin(req, res) {
  const adminCount = await User.countDocuments({ role: 'admin' });
  if (adminCount > 0) return res.status(403).json({ message: 'Initial admin already exists' });
  const name = requireText(req.body?.name, 'Nom', { max: 120 });
  const email = requireEmail(req.body?.email);
  const password = requireText(req.body?.password, 'Mot de passe', { min: 6, max: 128 });
  const user = await User.create({ name, email, password, role: 'admin' });
  res.status(201).json({ user: publicUser(user), token: generateToken(user._id) });
}

export async function login(req, res) {
  const email = requireEmail(req.body?.email);
  const password = requireText(req.body?.password, 'Mot de passe', { min: 1, max: 128 });
  const user = await User.findOne({ email });
  if (!user || !(await (user as any).matchPassword(password))) return res.status(401).json({ message: 'Invalid email or password' });
  res.json({ user: publicUser(user), token: generateToken(user._id) });
}

export async function me(req, res) { res.json(req.user); }
