import mongoose from 'mongoose';
import Product from '../models/Product.ts';
import Category from '../models/Category.ts';
import { escapeRegex } from '../utils/security.ts';
import { deactivateProduct } from '../utils/catalogLifecycle.ts';
import { getPagination } from '../utils/pagination.ts';

const isObjectId = (value) => mongoose.Types.ObjectId.isValid(value);
const numberOrUndefined = (value) => (value === undefined || value === '' ? undefined : Number(value));
const slugify = (value = '') => String(value).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

async function resolveCategoryIds(input, includeDescendants = false) {
  const values = Array.isArray(input) ? input : String(input || '').split(',');
  const cleaned = values.map((value) => String(value).trim()).filter(Boolean).filter((value) => value !== 'all');
  if (!cleaned.length) return [];

  const objectIds = cleaned.filter(isObjectId);
  const slugs = cleaned.filter((value) => !isObjectId(value));
  const categories = await Category.find({ $or: [{ _id: { $in: objectIds } }, { slug: { $in: slugs } }] }).select('_id');
  const foundIds = categories.map((category) => category._id);
  const directIds = objectIds.map((id) => new mongoose.Types.ObjectId(id));
  let ids = [...new Set([...foundIds, ...directIds].map(String))];
  if (includeDescendants && ids.length) {
    let frontier = [...ids];
    while (frontier.length) {
      const children = await Category.find({ parent: { $in: frontier } }).select('_id');
      const next = children.map((c) => String(c._id)).filter((id) => !ids.includes(id));
      ids.push(...next); frontier = next;
    }
  }
  return ids.map((id) => new mongoose.Types.ObjectId(id));
}

async function buildProductFilter(query) {
  const { category, categories, featured, search, minPrice, maxPrice, inStock, brand, includeInactive } = query;
  const filter: any = {};
  if (includeInactive !== 'true') { filter.isActive = true; filter.visibleOnSite = { $ne: false }; filter.publicationStatus = { $ne: 'hidden' }; }

  if (featured !== undefined) filter.featured = featured === 'true';
  if (query.home === 'true') filter.visibleOnHome = true;
  if (search) filter.visibleInSearch = { $ne: false };

  const categoryIds = await resolveCategoryIds(categories || category, true);
  if ((category || categories) && !categoryIds.length) return { _id: null };
  if (categoryIds.length) filter.categories = { $in: categoryIds };

  if (search) {
    const safeSearch = escapeRegex(String(search).trim());
    filter.$or = [
      { name: { $regex: safeSearch, $options: 'i' } },
      { description: { $regex: safeSearch, $options: 'i' } },
      { shortDescription: { $regex: safeSearch, $options: 'i' } },
      { slug: { $regex: safeSearch, $options: 'i' } },
      { sku: { $regex: safeSearch, $options: 'i' } },
      { brand: { $regex: safeSearch, $options: 'i' } },
      { tags: { $regex: safeSearch, $options: 'i' } }
    ];
  }

  const min = numberOrUndefined(minPrice);
  const max = numberOrUndefined(maxPrice);
  if ((min !== undefined && !Number.isNaN(min)) || (max !== undefined && !Number.isNaN(max))) {
    filter.price = {};
    if (min !== undefined && !Number.isNaN(min)) filter.price.$gte = min;
    if (max !== undefined && !Number.isNaN(max)) filter.price.$lte = max;
  }

  if (inStock === 'true') filter.stock = { $gt: 0 };
  if (brand) filter.brand = { $regex: String(brand).trim(), $options: 'i' };

  return filter;
}

function getSort(sort) {
  const sortMap = {
    'price-asc': { price: 1 },
    'price-desc': { price: -1 },
    newest: { createdAt: -1 },
    'best-rated': { rating: -1, reviews: -1 },
    stock: { stock: -1 },
    popular: { featured: -1, reviews: -1, createdAt: -1 }
  };
  return sortMap[sort] || sortMap.popular;
}

function populateProduct(query) {
  return query.populate('category', 'name slug image').populate({ path: 'categories', select: 'name slug image parent', populate: { path: 'parent', select: 'name slug' } });
}

export async function getProducts(req, res) {
  const filter = await buildProductFilter(req.query);
  const sort = { ...getSort(req.query.sort), _id: 1 };
  const withMeta = req.query.meta === 'true';
  const total = await Product.countDocuments(filter);
  const { page, limit, pages, skip } = getPagination(req.query, total);

  const items = await populateProduct(Product.find(filter)).sort(sort).skip(skip).limit(limit);

  if (!withMeta) return res.json(items);

  const [priceStats, categories, brands] = await Promise.all([
    Product.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: null, min: { $min: '$price' }, max: { $max: '$price' } } }
    ]),
    Category.aggregate([
      { $match: { isActive: true } },
      { $lookup: { from: 'products', localField: '_id', foreignField: 'categories', as: 'products' } },
      { $project: { name: 1, slug: 1, image: 1, parent: 1, count: { $size: { $filter: { input: '$products', as: 'product', cond: { $eq: ['$$product.isActive', true] } } } } } },
      { $sort: { name: 1 } }
    ]),
    Product.distinct('brand', { isActive: true, brand: { $ne: '' } })
  ]);

  res.json({
    items,
    total,
    page,
    limit,
    pages,
    filters: {
      categories,
      brands: brands.filter(Boolean).sort(),
      price: { min: priceStats[0]?.min || 0, max: priceStats[0]?.max || 0 }
    }
  });
}

export async function getProductById(req, res) {
  const query = isObjectId(req.params.id) ? { _id: req.params.id } : { slug: req.params.id };
  const product = await populateProduct(Product.findOne(query));
  if (!product) return res.status(404).json({ message: 'Product not found' });
  res.json(product);
}

async function normalizeProductPayload(body) {
  const payload = { ...body };
  if (!payload.slug && payload.name) payload.slug = slugify(payload.name);
  const ids = await resolveCategoryIds(payload.categories || payload.category);
  if (ids.length) {
    payload.categories = ids;
    payload.category = ids[0];
  }
  if (typeof payload.images === 'string') payload.images = payload.images.split('\n').map((item) => item.trim()).filter(Boolean);
  if (typeof payload.demoVideo === 'string') payload.demoVideo = payload.demoVideo.trim();
  if (typeof payload.demoVideoTitle === 'string') payload.demoVideoTitle = payload.demoVideoTitle.trim();
  if (!['url', 'youtube', 'vimeo', 'upload'].includes(payload.demoVideoType)) payload.demoVideoType = 'url';
  if (typeof payload.tags === 'string') payload.tags = payload.tags.split(',').map((item) => item.trim()).filter(Boolean);
  return payload;
}

export async function createProduct(req, res) {
  const payload = await normalizeProductPayload(req.body);
  if (!payload.categories?.length) return res.status(400).json({ message: 'At least one category is required' });
  const product = await Product.create(payload);
  const populated = await populateProduct(Product.findById(product._id));
  res.status(201).json(populated);
}

export async function updateProduct(req, res) {
  const payload = await normalizeProductPayload(req.body);
  const product = await populateProduct(Product.findByIdAndUpdate(req.params.id, payload, { new: true, runValidators: true }));
  if (!product) return res.status(404).json({ message: 'Product not found' });
  res.json(product);
}

export async function deleteProduct(req, res) {
  const product = await deactivateProduct(req.params.id);
  if (!product) return res.status(404).json({ message: 'Product not found' });
  res.json({ message: 'Product deactivated successfully', productId: req.params.id, deactivated: true });
}
