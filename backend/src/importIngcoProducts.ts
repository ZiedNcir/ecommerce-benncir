import fs from 'node:fs/promises';
import path from 'node:path';
import dotenv from 'dotenv';
import connectDB from './config/db.ts';
import Product from './models/Product.ts';
import Category from './models/Category.ts';
import { ingcoCategoryMap } from './data/ingcoCategoryMap.ts';

dotenv.config();
await connectDB();

const inputPath = path.resolve(process.env.INGCO_IMPORT_FILE || 'data/ingco-products.json');
const raw = JSON.parse(await fs.readFile(inputPath, 'utf8'));
const products = Array.isArray(raw) ? raw : raw.products;
if (!Array.isArray(products)) throw new Error('Format import invalide: tableau products absent');

const categories = await Category.find({ isActive: true }).select('_id slug parent');
const categoryBySlug = new Map(categories.map((category) => [category.slug, category]));
const fallback = categoryBySlug.get('outils-de-bricolage') || categoryBySlug.get('accessoires');

let created = 0;
let updated = 0;
let skipped = 0;

for (const source of products) {
  if (!source?.name || !Number.isFinite(Number(source.price)) || Number(source.price) <= 0) {
    skipped += 1;
    continue;
  }

  const targetSlug = ingcoCategoryMap[source.sourceCategorySlug] || source.sourceCategorySlug;
  const targetCategory = categoryBySlug.get(targetSlug) || fallback;
  if (!targetCategory) {
    console.warn(`Catégorie introuvable pour ${source.name}: ${source.sourceCategorySlug}`);
    skipped += 1;
    continue;
  }

  const parent = targetCategory.parent ? categoryBySlug.get(String(targetCategory.parent)) : null;
  const categoryIds = [targetCategory._id, parent?._id].filter(Boolean);
  const payload = {
    name: source.name,
    slug: source.slug,
    description: source.description || source.shortDescription || source.name,
    shortDescription: source.shortDescription || '',
    price: Number(source.price),
    oldPrice: Number(source.oldPrice || 0),
    stock: Number(source.stock ?? 10),
    images: Array.isArray(source.images) ? source.images.filter(Boolean) : [],
    categories: categoryIds,
    category: targetCategory._id,
    sku: source.sku || '',
    brand: source.brand || 'INGCO',
    rating: Number(source.rating || 5),
    reviews: Number(source.reviews || 0),
    tags: Array.isArray(source.tags) ? source.tags : ['INGCO'],
    featured: Boolean(source.featured),
    isActive: source.isActive !== false,
    sourceName: source.sourceName || 'ingco.tn',
    sourceUrl: source.sourceUrl || '',
    sourceExternalId: source.sourceExternalId || source.sku || source.slug,
    importedAt: source.importedAt ? new Date(source.importedAt) : new Date(),
  };

  const query = source.sourceUrl ? { sourceUrl: source.sourceUrl } : { slug: source.slug };
  const existing = await Product.findOne(query).select('_id');
  await Product.findOneAndUpdate(query, { $set: payload }, { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true });
  if (existing) updated += 1; else created += 1;
}

console.log(`Import INGCO terminé: ${created} créés, ${updated} mis à jour, ${skipped} ignorés.`);
process.exit(0);
