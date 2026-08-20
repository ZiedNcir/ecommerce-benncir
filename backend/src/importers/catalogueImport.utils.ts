import fs from 'node:fs/promises';

export type SourceProduct = Record<string, any>;

export type CataloguePayload = {
  complete?: boolean;
  products: SourceProduct[];
};

export type CatalogueSourceRules = {
  allowedBrands?: string[];
  allowedHosts?: string[];
  defaultBrand: string;
  defaultSourceName: string;
};

export async function readCataloguePayload(
  inputPath: string,
  allowIncomplete = false,
  incompleteOverrideName = 'IMPORT_ALLOW_INCOMPLETE=true',
): Promise<CataloguePayload> {
  const raw = JSON.parse(await fs.readFile(inputPath, 'utf8'));
  const products = Array.isArray(raw) ? raw : raw?.products;
  if (!Array.isArray(products)) {
    throw new Error('Format import invalide : tableau products absent');
  }
  if (!Array.isArray(raw) && raw?.complete === false && !allowIncomplete) {
    throw new Error(`Export incomplet : relancez le scraper ou utilisez ${incompleteOverrideName}`);
  }
  return { complete: Array.isArray(raw) ? undefined : raw.complete, products };
}

export function validateCatalogueSource(source: SourceProduct, rules: CatalogueSourceRules) {
  const errors: string[] = [];
  if (!source?.name || !String(source.name).trim()) errors.push('nom absent');
  if (!source?.slug || !String(source.slug).trim()) errors.push('slug absent');
  if (!Number.isFinite(Number(source?.price)) || Number(source.price) <= 0) errors.push('prix invalide');

  const brand = String(source?.brand || rules.defaultBrand).trim().toUpperCase();
  const allowedBrands = (rules.allowedBrands || []).map((value) => value.toUpperCase());
  if (allowedBrands.length && !allowedBrands.includes(brand)) {
    errors.push(`marque inattendue: ${source?.brand || brand}`);
  }

  try {
    const url = new URL(String(source?.sourceUrl || ''));
    const hostname = url.hostname.toLowerCase();
    if (rules.allowedHosts?.length && !rules.allowedHosts.map((host) => host.toLowerCase()).includes(hostname)) {
      const domains = [...new Set(rules.allowedHosts.map((host) => host.toLowerCase().replace(/^www\./, '')))];
      errors.push(`URL source hors ${domains.join(' / ')}`);
    }
  } catch {
    errors.push('URL source absente ou invalide');
  }

  return errors;
}

export function validateDylluSource(source: SourceProduct) {
  return validateCatalogueSource(source, {
    allowedBrands: ['DYLLU'],
    allowedHosts: ['technotools.tn', 'www.technotools.tn'],
    defaultBrand: 'DYLLU',
    defaultSourceName: 'technotools.tn',
  });
}

function finiteNumber(value: unknown, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function uniqueStrings(values: unknown[]) {
  return [...new Set(values.map((value) => String(value || '').trim()).filter(Boolean))];
}

export function buildCatalogueProductPayload(
  source: SourceProduct,
  categoryIds: unknown[],
  categoryId: unknown,
  rules: Pick<CatalogueSourceRules, 'defaultBrand' | 'defaultSourceName'>,
  slug = String(source.slug || '').trim().toLowerCase(),
) {
  const price = Math.max(0, finiteNumber(source.price));
  const oldPrice = Math.max(0, finiteNumber(source.oldPrice));
  const stock = Math.max(0, Math.floor(finiteNumber(source.stock)));
  const rating = Math.min(5, Math.max(0, finiteNumber(source.rating)));
  const reviews = Math.max(0, Math.floor(finiteNumber(source.reviews)));
  const brand = String(source.brand || rules.defaultBrand).trim() || rules.defaultBrand;
  const sourceName = String(source.sourceName || rules.defaultSourceName).trim() || rules.defaultSourceName;

  return {
    name: String(source.name).trim(),
    slug,
    description: String(source.description || source.shortDescription || source.name).trim(),
    shortDescription: String(source.shortDescription || '').trim(),
    price,
    oldPrice: oldPrice > price ? oldPrice : 0,
    stock,
    trackStock: true,
    images: uniqueStrings(Array.isArray(source.images) ? source.images : [])
      .filter((image) => /^https?:\/\//i.test(image)),
    categories: categoryIds,
    category: categoryId,
    sku: String(source.sku || '').trim(),
    brand,
    rating,
    reviews,
    tags: uniqueStrings(Array.isArray(source.tags) ? source.tags : [brand]),
    featured: Boolean(source.featured),
    isActive: source.isActive !== false,
    publicationStatus: source.isActive === false ? 'hidden' : 'published',
    visibleOnSite: source.isActive !== false,
    visibleInSearch: source.isActive !== false,
    sourceName,
    sourceUrl: String(source.sourceUrl || '').trim(),
    sourceExternalId: String(source.sourceExternalId || source.sku || source.slug).trim(),
    importedAt: source.importedAt && !Number.isNaN(Date.parse(source.importedAt))
      ? new Date(source.importedAt)
      : new Date(),
  };
}

export function buildDylluProductPayload(source: SourceProduct, categoryIds: unknown[], categoryId: unknown) {
  return buildCatalogueProductPayload(source, categoryIds, categoryId, {
    defaultBrand: 'DYLLU',
    defaultSourceName: 'technotools.tn',
  });
}

export function sourceIdentity(source: SourceProduct, defaultSourceName = 'technotools.tn') {
  if (source.sourceUrl) return { sourceUrl: String(source.sourceUrl).trim() };
  if (source.sourceExternalId) {
    return {
      sourceName: String(source.sourceName || defaultSourceName).trim(),
      sourceExternalId: String(source.sourceExternalId).trim(),
    };
  }
  return { slug: String(source.slug || '').trim().toLowerCase() };
}

export function slugCandidate(source: SourceProduct, attempt = 0) {
  const base = String(source.slug || source.name || 'produit')
    .trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'produit';
  if (attempt === 0) return base;
  const brand = String(source.brand || source.sourceName || 'import').trim().toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'import';
  const id = String(source.sourceExternalId || source.sku || attempt).trim().toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || String(attempt);
  return attempt === 1 ? `${base}-${brand}-${id}` : `${base}-${brand}-${id}-${attempt}`;
}
