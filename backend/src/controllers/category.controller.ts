import Category from '../models/Category.ts';
import Product from '../models/Product.ts';

const slugify = (value = '') => String(value).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

function payload(body: any = {}) {
  return {
    name: String(body.name || '').trim(),
    slug: String(body.slug || slugify(body.name || '')).trim(),
    description: String(body.description || '').trim(),
    image: String(body.image || '').trim(),
    parent: body.parent || null,
    sortOrder: Number(body.sortOrder || 0),
    isActive: body.isActive !== false,
  };
}

export function buildCategoryTree(categories: any[] = []) {
  const map = new Map(categories.map((item) => [String(item._id), { ...(item.toObject ? item.toObject() : item), children: [] }]));
  const roots: any[] = [];
  map.forEach((item) => {
    const parentId = item.parent?._id || item.parent;
    if (parentId && map.has(String(parentId))) map.get(String(parentId)).children.push(item);
    else roots.push(item);
  });
  const sort = (nodes) => nodes.sort((a,b) => (a.sortOrder || 0) - (b.sortOrder || 0) || a.name.localeCompare(b.name)).map((node) => ({ ...node, children: sort(node.children || []) }));
  return sort(roots);
}

async function attachCounts(categories: any[]) {
  const counts = await Product.aggregate([{ $match: { isActive: true } }, { $unwind: '$categories' }, { $group: { _id: '$categories', count: { $sum: 1 } } }]);
  const map = new Map(counts.map((row) => [String(row._id), row.count]));
  return categories.map((category) => ({ ...category.toObject(), productCount: map.get(String(category._id)) || 0, count: map.get(String(category._id)) || 0 }));
}

export async function getCategories(req, res) {
  const filter: any = {};
  if (req.query.includeInactive !== 'true' && req.query.all !== 'true') filter.isActive = true;
  if (req.query.parent === 'root') filter.parent = null;
  else if (req.query.parent) filter.parent = req.query.parent;
  if (req.query.search) filter.$or = ['name','slug','description'].map((field) => ({ [field]: { $regex: String(req.query.search).trim(), $options: 'i' } }));
  const categories = await Category.find(filter).populate('parent', 'name slug').sort({ sortOrder: 1, name: 1 });
  const withCounts = await attachCounts(categories);
  res.json(req.query.tree === 'true' ? buildCategoryTree(withCounts) : withCounts);
}

export async function getCategoryTree(req, res) {
  const filter = req.query.includeInactive === 'true' ? {} : { isActive: true };
  const categories = await Category.find(filter).sort({ sortOrder: 1, name: 1 });
  res.json(buildCategoryTree(await attachCounts(categories)));
}

export async function getCategoryById(req, res) {
  const category = await Category.findById(req.params.id).populate('parent', 'name slug');
  if (!category) return res.status(404).json({ message: 'Catégorie introuvable' });
  const children = await Category.find({ parent: category._id }).sort({ sortOrder: 1, name: 1 });
  res.json({ ...category.toObject(), children });
}

export async function createCategory(req, res) {
  const data = payload(req.body);
  if (!data.name) return res.status(400).json({ message: 'Le nom est obligatoire' });
  if (data.parent && String(data.parent) === String(req.params.id || '')) return res.status(400).json({ message: 'Parent invalide' });
  if (await Category.findOne({ slug: data.slug })) return res.status(409).json({ message: 'Ce slug existe déjà' });
  res.status(201).json(await Category.create(data));
}

export async function updateCategory(req, res) {
  const data = payload(req.body);
  if (String(data.parent || '') === String(req.params.id)) return res.status(400).json({ message: 'Une catégorie ne peut pas être son propre parent' });
  if (await Category.findOne({ slug: data.slug, _id: { $ne: req.params.id } })) return res.status(409).json({ message: 'Ce slug existe déjà' });
  const category = await Category.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true });
  if (!category) return res.status(404).json({ message: 'Catégorie introuvable' });
  res.json(category);
}

export async function deleteCategory(req, res) {
  const childCount = await Category.countDocuments({ parent: req.params.id });
  if (childCount && req.query.force !== 'true') return res.status(409).json({ message: `Cette catégorie contient ${childCount} sous-catégorie(s). Utilisez force=true pour supprimer.` });
  const linkedProducts = await Product.countDocuments({ categories: req.params.id });
  if (linkedProducts && req.query.force !== 'true') return res.status(409).json({ message: `Cette catégorie est utilisée par ${linkedProducts} produit(s). Utilisez force=true.` });
  if (req.query.force === 'true') {
    await Category.updateMany({ parent: req.params.id }, { $set: { parent: null } });
    await Product.updateMany({ categories: req.params.id }, { $pull: { categories: req.params.id } });
  }
  const category = await Category.findByIdAndDelete(req.params.id);
  if (!category) return res.status(404).json({ message: 'Catégorie introuvable' });
  res.json({ message: 'Catégorie supprimée', categoryId: req.params.id });
}
