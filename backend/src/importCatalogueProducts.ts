import path from 'node:path';
import { pathToFileURL } from 'node:url';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from './config/db.ts';
import Product from './models/Product.ts';
import Category from './models/Category.ts';
import { getImportProfile, type ImportProfile } from './importers/catalogueImport.config.ts';
import {
  buildCatalogueProductPayload, readCataloguePayload, slugCandidate, sourceIdentity,
  validateCatalogueSource, type SourceProduct,
} from './importers/catalogueImport.utils.ts';

dotenv.config();

type CategoryRow = { _id: unknown; slug: string; parent?: unknown };

async function availableSlug(source: SourceProduct, existingId?: unknown) {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const slug = slugCandidate(source, attempt);
    const collision = await Product.exists({ slug, ...(existingId ? { _id: { $ne: existingId } } : {}) });
    if (!collision) return slug;
  }
  throw new Error(`Impossible de générer un slug unique pour ${source.name}`);
}

export async function importCatalogue(profile: ImportProfile) {
  const inputPath = path.resolve(process.env[profile.inputEnv] || profile.defaultInput);
  const dryRun = process.env[profile.dryRunEnv] === 'true' || process.env.IMPORT_DRY_RUN === 'true';
  const allowIncomplete = process.env[profile.allowIncompleteEnv] === 'true';
  const { products } = await readCataloguePayload(inputPath, allowIncomplete, `${profile.allowIncompleteEnv}=true`);
  const valid: SourceProduct[] = [];
  const rejected: Array<{ name: string; reasons: string[] }> = [];

  for (const source of products) {
    const reasons = validateCatalogueSource(source, profile);
    if (reasons.length) rejected.push({ name: String(source?.name || 'Produit sans nom'), reasons });
    else valid.push(source);
  }

  if (dryRun) {
    console.log(`Validation ${profile.label}: ${valid.length} valides, ${rejected.length} rejetés, aucune écriture MongoDB.`);
    rejected.slice(0, 20).forEach((item) => console.warn(`- ${item.name}: ${item.reasons.join(', ')}`));
    return { created: 0, updated: 0, skipped: rejected.length, valid: valid.length, dryRun: true };
  }

  await connectDB();
  const categories = await Category.find({ isActive: true }).select('_id slug parent').lean() as CategoryRow[];
  const bySlug = new Map(categories.map((category) => [category.slug, category]));
  const fallback = bySlug.get('outils-de-bricolage') || bySlug.get('accessoires');
  if (!fallback) throw new Error('Aucune catégorie de secours trouvée. Exécutez npm run seed:categories.');

  let created = 0;
  let updated = 0;
  let skipped = rejected.length;
  for (const source of valid) {
    try {
      const sourceSlug = String(source.sourceCategorySlug || '').trim().toLowerCase();
      const target = bySlug.get(profile.categoryMap[sourceSlug] || sourceSlug) || fallback;
      const parent = target.parent ? bySlug.get(String(target.parent)) : null;
      const categoryIds = [target._id, parent?._id].filter(Boolean);
      const identity = sourceIdentity(source, profile.defaultSourceName);
      const existing = await Product.findOne(identity).select('_id').lean();
      const slug = await availableSlug(source, existing?._id);
      const payload = buildCatalogueProductPayload(source, categoryIds, target._id, profile, slug);
      const result = await Product.updateOne(identity, { $set: payload }, {
        upsert: true, runValidators: true, setDefaultsOnInsert: true,
      });
      if (result.upsertedCount) created += 1;
      else updated += 1;
    } catch (error) {
      skipped += 1;
      console.error(`Produit ignoré (${source.name}): ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  console.log(`Import ${profile.label} terminé: ${created} créés, ${updated} mis à jour, ${skipped} ignorés.`);
  return { created, updated, skipped, valid: valid.length, dryRun: false };
}

export async function runCatalogueImport(profileName: string) {
  try {
    return await importCatalogue(getImportProfile(profileName));
  } finally {
    if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runCatalogueImport(process.argv[2] || process.env.IMPORT_PROFILE || '').catch((error) => {
    console.error(`Import impossible: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  });
}
