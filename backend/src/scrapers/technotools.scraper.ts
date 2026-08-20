import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { decodeEntities, parsePrice, slugify, stripTags } from './ingco.scraper.ts';

type JsonObject = Record<string, any>;

export type TechnoToolsProduct = {
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  price: number;
  oldPrice: number;
  stock: number;
  stockEstimated: boolean;
  availability: 'in_stock' | 'out_of_stock';
  images: string[];
  sku: string;
  brand: string;
  rating: number;
  reviews: number;
  tags: string[];
  featured: boolean;
  isActive: boolean;
  sourceName: string;
  sourceUrl: string;
  sourceExternalId: string;
  sourceCategoryName: string;
  sourceCategorySlug: string;
  importedAt: string;
};

type ScrapeError = {
  stage: 'robots' | 'listing' | 'product';
  url: string;
  message: string;
  status?: number;
};

type ScrapeOptions = {
  output?: string;
  maxPages?: number;
  maxProducts?: number;
  delayMs?: number;
  startPage?: number;
  categoryId?: number;
  indexId?: string;
  retries?: number;
  timeoutMs?: number;
  resume?: boolean;
  checkpointEvery?: number;
  defaultStock?: number;
};

const BASE_URL = new URL(process.env.TECHNOTOOLS_BASE_URL || 'https://technotools.tn').origin;
const DEFAULT_OUTPUT = path.resolve(process.env.TECHNOTOOLS_OUTPUT || 'data/technotools-products.json');
const USER_AGENT = process.env.TECHNOTOOLS_USER_AGENT
  || 'BencirCatalogueBot/2.1 (+catalogue import; respectful rate limiting)';
const MAX_RESPONSE_BYTES = 8 * 1024 * 1024;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, Math.max(0, ms)));
const unique = <T>(values: T[]) => [...new Set(values.filter(Boolean))];
const messageOf = (error: unknown) => error instanceof Error ? error.message : String(error);
const statusOf = (error: unknown) => typeof (error as { status?: unknown })?.status === 'number'
  ? (error as { status: number }).status
  : undefined;

function absoluteUrl(value = '', base = BASE_URL) {
  try {
    const url = new URL(decodeEntities(value.trim()), base);
    if (!['http:', 'https:'].includes(url.protocol)) return '';
    url.hash = '';
    return url.href;
  } catch {
    return '';
  }
}

function localUrl(value = '') {
  const resolved = absoluteUrl(value);
  if (!resolved) return '';
  const url = new URL(resolved);
  if (url.origin !== BASE_URL) return '';
  url.hash = '';
  if (/\/produit\//i.test(url.pathname)) url.search = '';
  return url.href;
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function extractAttribute(tag: string, name: string) {
  const match = new RegExp(`\\b${escapeRegExp(name)}\\s*=\\s*(["'])(.*?)\\1`, 'i').exec(tag);
  return decodeEntities(match?.[2] || '');
}

function extractMeta(html: string, key: string) {
  const escaped = escapeRegExp(key);
  const patterns = [
    new RegExp(`<meta\\b[^>]*(?:property|name)\\s*=\\s*["']${escaped}["'][^>]*content\\s*=\\s*(["'])(.*?)\\1`, 'i'),
    new RegExp(`<meta\\b[^>]*content\\s*=\\s*(["'])(.*?)\\1[^>]*(?:property|name)\\s*=\\s*["']${escaped}["']`, 'i'),
  ];
  for (const pattern of patterns) {
    const match = pattern.exec(html);
    if (match) return decodeEntities(match[2].trim());
  }
  return '';
}

function extractCanonical(html: string) {
  for (const tag of html.match(/<link\b[^>]*>/gi) || []) {
    if (/\brel\s*=\s*(["'])canonical\1/i.test(tag)) return localUrl(extractAttribute(tag, 'href'));
  }
  return localUrl(extractMeta(html, 'og:url'));
}

function extractBalancedDiv(html: string, openingPattern: RegExp) {
  const opening = openingPattern.exec(html);
  if (!opening) return '';
  const start = opening.index + opening[0].length;
  const tags = /<\/?div\b[^>]*>/gi;
  tags.lastIndex = start;
  let depth = 1;
  let tag: RegExpExecArray | null;
  while ((tag = tags.exec(html))) {
    depth += /^<\//.test(tag[0]) ? -1 : 1;
    if (depth === 0) return html.slice(start, tag.index);
  }
  return html.slice(start);
}

function cleanJsonLd(value: string) {
  return value.trim().replace(/^<!--/, '').replace(/-->$/, '').trim();
}

export function extractJsonLd(html: string) {
  const blocks: unknown[] = [];
  const regex = /<script\b[^>]*\btype\s*=\s*(["'])application\/ld\+json(?:\s*;\s*charset=[^"']+)?\1[^>]*>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(html))) {
    const raw = cleanJsonLd(match[2]);
    for (const candidate of unique([raw, decodeEntities(raw)])) {
      try {
        blocks.push(JSON.parse(candidate));
        break;
      } catch {
        // Un bloc défectueux ne doit pas empêcher les autres solutions de repli.
      }
    }
  }
  return blocks;
}

function flattenJsonLd(value: unknown, output: JsonObject[] = [], seen = new Set<object>()) {
  if (!value || typeof value !== 'object' || seen.has(value as object)) return output;
  seen.add(value as object);
  if (Array.isArray(value)) {
    value.forEach((item) => flattenJsonLd(item, output, seen));
    return output;
  }
  output.push(value as JsonObject);
  Object.values(value as JsonObject).forEach((item) => flattenJsonLd(item, output, seen));
  return output;
}

function isType(node: JsonObject, expected: string) {
  const type = node?.['@type'];
  return type === expected || (Array.isArray(type) && type.includes(expected));
}

function productSchema(html: string) {
  return extractJsonLd(html)
    .flatMap((block) => flattenJsonLd(block))
    .find((node) => isType(node, 'Product')) || {};
}

function retryAfterMs(value: string | null) {
  if (!value) return 0;
  const seconds = Number(value);
  if (Number.isFinite(seconds)) return Math.max(0, seconds * 1000);
  const date = Date.parse(value);
  return Number.isFinite(date) ? Math.max(0, date - Date.now()) : 0;
}

async function fetchText(url: string, retries: number, timeoutMs: number) {
  let lastError: unknown = new Error(`Impossible de charger ${url}`);
  for (let attempt = 1; attempt <= retries; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, {
        redirect: 'follow',
        signal: controller.signal,
        headers: {
          'user-agent': USER_AGENT,
          accept: 'text/html,application/xhtml+xml,text/plain;q=0.8',
          'accept-language': 'fr-TN,fr;q=0.9,en;q=0.5',
        },
      });
      if (new URL(response.url).origin !== BASE_URL) {
        throw new Error(`Redirection hors domaine refusée: ${response.url}`);
      }
      if (!response.ok) {
        throw Object.assign(new Error(`HTTP ${response.status} pour ${url}`), {
          status: response.status,
          retryAfter: retryAfterMs(response.headers.get('retry-after')),
        });
      }
      const length = Number(response.headers.get('content-length') || 0);
      if (length > MAX_RESPONSE_BYTES) throw new Error(`Réponse trop volumineuse pour ${url}`);
      const text = await response.text();
      if (Buffer.byteLength(text, 'utf8') > MAX_RESPONSE_BYTES) {
        throw new Error(`Réponse trop volumineuse pour ${url}`);
      }
      return text;
    } catch (error) {
      lastError = error;
      const status = statusOf(error);
      const retryable = !status || status === 408 || status === 425 || status === 429 || status >= 500;
      if (!retryable || attempt >= retries) break;
      const serverDelay = Number((error as { retryAfter?: number })?.retryAfter || 0);
      const backoff = Math.min(15_000, 700 * (2 ** (attempt - 1))) + Math.floor(Math.random() * 250);
      await sleep(Math.max(serverDelay, backoff));
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastError;
}

export function buildListingUrl(page: number, categoryId = 115, indexId = 'index-154740') {
  const url = new URL('/', BASE_URL);
  url.searchParams.set('id', indexId);
  url.searchParams.set('ucat', String(categoryId));
  if (page > 1) url.searchParams.set('upage', String(page));
  return url.href;
}

export function extractProductLinks(html: string, requiredCategoryId = 115) {
  const links: string[] = [];
  const cardRegex = new RegExp(
    `<div\\b[^>]*class=(["'])[^"']*\\btmb\\b[^"']*\\bgrid-cat-${requiredCategoryId}\\b[^"']*\\1[^>]*>([\\s\\S]*?)(?=<div\\b[^>]*class=(["'])[^"']*\\btmb\\b|<div\\b[^>]*class=(["'])[^"']*\\bisotope-footer\\b)`,
    'gi',
  );
  let card: RegExpExecArray | null;
  while ((card = cardRegex.exec(html))) {
    const linkRegex = /<a\b[^>]*\bhref\s*=\s*(["'])(.*?)\1[^>]*>/gi;
    let link: RegExpExecArray | null;
    while ((link = linkRegex.exec(card[2]))) {
      const url = localUrl(link[2]);
      if (url && /\/produit\/[^/?#]+\/?$/i.test(new URL(url).pathname)) {
        links.push(url);
        break;
      }
    }
  }

  // Repli pour une évolution du thème : les liens restent filtrés par le chemin produit.
  if (!links.length) {
    const regex = /<a\b[^>]*\bhref\s*=\s*(["'])(.*?)\1[^>]*>/gi;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(html))) {
      const url = localUrl(match[2]);
      if (url && /\/produit\/[^/?#]+\/?$/i.test(new URL(url).pathname)) links.push(url);
    }
  }
  return unique(links);
}

function schemaImages(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.flatMap(schemaImages);
  if (typeof value === 'string') return [absoluteUrl(value)];
  if (typeof value === 'object') {
    const image = value as JsonObject;
    return [absoluteUrl(image.url || image.contentUrl || image.thumbnailUrl || '')];
  }
  return [];
}

function supportedImage(value: string) {
  try {
    const url = new URL(value);
    return url.origin === BASE_URL && /\.(?:avif|gif|jpe?g|png|webp)$/i.test(url.pathname);
  } catch {
    return false;
  }
}

function galleryImages(html: string, schema: JsonObject) {
  const images: string[] = [...schemaImages(schema.image)];
  const gallery = extractBalancedDiv(
    html,
    /<div\b[^>]*class\s*=\s*(["'])[^"']*woocommerce-product-gallery[^"']*\1[^>]*>/i,
  );
  for (const tag of gallery.match(/<(?:img|a)\b[^>]*>/gi) || []) {
    for (const attribute of ['data-large_image', 'data-src', 'data-lazy-src', 'href', 'src']) {
      const value = extractAttribute(tag, attribute);
      if (value && !value.startsWith('data:')) images.push(absoluteUrl(value));
    }
  }
  images.push(absoluteUrl(extractMeta(html, 'og:image')));
  return unique(images).filter(supportedImage);
}

function offersOf(schema: JsonObject) {
  return (Array.isArray(schema.offers) ? schema.offers : [schema.offers])
    .filter((offer) => offer && typeof offer === 'object');
}

function currentPrice(offers: JsonObject[], html: string) {
  const candidates = offers.flatMap((offer) => [offer.price, offer.lowPrice, offer.priceSpecification?.price])
    .map(parsePrice)
    .filter((value) => value > 0);
  if (candidates.length) return Math.min(...candidates);
  const summary = html.slice(0, html.indexOf('<div class="product_meta') || html.length);
  const current = /<ins\b[^>]*>([\s\S]*?)<\/ins>/i.exec(summary)?.[1] || summary;
  return parsePrice(stripTags(/<(?:bdi|span)\b[^>]*>([\s\S]*?)<\/(?:bdi|span)>/i.exec(current)?.[1] || current));
}

function oldPrice(html: string, price: number) {
  const summary = html.slice(0, html.indexOf('<div class="product_meta') || html.length);
  const deleted = /<del\b[^>]*>([\s\S]*?)<\/del>/i.exec(summary)?.[1] || '';
  const value = parsePrice(stripTags(deleted));
  return value > price ? value : 0;
}

function productCategories(html: string) {
  const metadata = extractBalancedDiv(
    html,
    /<div\b[^>]*class\s*=\s*(["'])[^"']*\bproduct_meta\b[^"']*\1[^>]*>/i,
  );
  const values: Array<{ name: string; slug: string }> = [];
  const links = /<a\b[^>]*href\s*=\s*(["'])(.*?)\1[^>]*>([\s\S]*?)<\/a>/gi;
  let link: RegExpExecArray | null;
  while ((link = links.exec(metadata))) {
    const url = localUrl(link[2]);
    const slug = url.match(/\/categorie-produit\/(?:[^/]+\/)*([^/]+)\/?$/i)?.[1] || '';
    const name = stripTags(link[3]);
    if (name && slug) values.push({ name, slug: decodeURIComponent(slug) });
  }
  return values;
}

function productBrand(html: string, schema: JsonObject) {
  const schemaBrand = stripTags(schema.brand?.name || schema.brand || '');
  if (schemaBrand) return schemaBrand;
  const branded = /<span\b[^>]*class\s*=\s*(["'])[^"']*\bbranded_as\b[^"']*\1[^>]*>([\s\S]*?)<\/span>/i.exec(html)?.[2] || '';
  return stripTags(/<a\b[^>]*>([\s\S]*?)<\/a>/i.exec(branded)?.[1] || '') || 'INGCO';
}

function availability(html: string, offers: JsonObject[]) {
  const values = offers.map((offer) => String(offer.availability || '').toLowerCase());
  if (values.some((value) => /outofstock|soldout|discontinued/.test(value))) return false;
  if (values.some((value) => /instock|preorder|limitedavailability/.test(value))) return true;
  const productClass = /<(?:div|article)\b[^>]*class\s*=\s*(["'])([^"']*\bproduct\b[^"']*)\1/i.exec(html)?.[2] || '';
  if (/\boutofstock\b/i.test(productClass) || /rupture\s+de\s+stock/i.test(html)) return false;
  return /\binstock\b/i.test(productClass);
}

export function parseProduct(html: string, source: string, defaultStock = 10): TechnoToolsProduct {
  const schema = productSchema(html);
  const offers = offersOf(schema);
  const title = /<h1\b[^>]*class\s*=\s*(["'])[^"']*\bproduct_title\b[^"']*\1[^>]*>([\s\S]*?)<\/h1>/i.exec(html)?.[2];
  const name = stripTags(schema.name || title || extractMeta(html, 'og:title'));
  const canonical = localUrl(schema.url || extractCanonical(html) || source);
  const slug = decodeURIComponent(new URL(canonical || source).pathname.match(/\/produit\/([^/]+)/i)?.[1] || slugify(name));
  const price = currentPrice(offers, html);
  const categories = productCategories(html);
  const category = categories.at(-1) || { name: 'INGCO', slug: 'ingco' };
  const brand = productBrand(html, schema);
  const skuHtml = /<span\b[^>]*class\s*=\s*(["'])[^"']*\bsku\b[^"']*\1[^>]*>([\s\S]*?)<\/span>/i.exec(html)?.[2];
  const sku = stripTags(schema.sku || schema.mpn || skuHtml || '');
  const descriptionHtml = extractBalancedDiv(html, /<div\b[^>]*id\s*=\s*(["'])tab-description(?:-\d+)?\1[^>]*>/i);
  const description = stripTags(schema.description || descriptionHtml);
  const shortHtml = extractBalancedDiv(html, /<div\b[^>]*class\s*=\s*(["'])[^"']*woocommerce-product-details__short-description[^"']*\1[^>]*>/i);
  const shortDescription = stripTags(shortHtml || description).slice(0, 260);
  const inStock = availability(html, offers);
  const rating = Number(schema.aggregateRating?.ratingValue ?? 0);
  const reviews = Number(schema.aggregateRating?.reviewCount ?? schema.aggregateRating?.ratingCount ?? 0);
  const productId = /id\s*=\s*(["'])product-(\d+)\1/i.exec(html)?.[2] || '';
  const productClass = /<(?:div|article)\b[^>]*class\s*=\s*(["'])([^"']*\bproduct\b[^"']*)\1/i.exec(html)?.[2] || '';

  return {
    name,
    slug,
    description: description || (name ? `${name} — produit professionnel ${brand}.` : ''),
    shortDescription,
    price,
    oldPrice: oldPrice(html, price),
    stock: inStock ? Math.max(0, Math.floor(defaultStock)) : 0,
    stockEstimated: inStock,
    availability: inStock ? 'in_stock' : 'out_of_stock',
    images: galleryImages(html, schema),
    sku,
    brand,
    rating: Number.isFinite(rating) ? Math.min(Math.max(rating, 0), 5) : 0,
    reviews: Number.isFinite(reviews) ? Math.max(0, Math.floor(reviews)) : 0,
    tags: unique([brand, ...categories.map((item) => item.name), sku]).filter(Boolean),
    featured: /\bfeatured\b/i.test(productClass),
    isActive: true,
    sourceName: new URL(BASE_URL).hostname,
    sourceUrl: canonical,
    sourceExternalId: String(schema.productID || schema.mpn || sku || productId || slug),
    sourceCategoryName: category.name,
    sourceCategorySlug: category.slug,
    importedAt: new Date().toISOString(),
  };
}

export function validateProduct(product: TechnoToolsProduct) {
  const errors: string[] = [];
  if (!product.name) errors.push('nom absent');
  if (!product.slug) errors.push('slug absent');
  if (!Number.isFinite(product.price) || product.price <= 0) errors.push('prix absent ou invalide');
  if (!product.sourceUrl) errors.push('URL source absente ou hors domaine');
  if (!product.images.length) errors.push('aucune image');
  return errors;
}

type RobotsRule = { allow: boolean; path: string };

function robotsRuleMatches(rulePath: string, target: string) {
  const anchored = rulePath.endsWith('$');
  const source = anchored ? rulePath.slice(0, -1) : rulePath;
  const expression = source.split('*').map(escapeRegExp).join('.*');
  return new RegExp(`^${expression}${anchored ? '$' : ''}`).test(target);
}

function robotsAllows(text: string, target: string) {
  const groups: Array<{ agents: string[]; rules: RobotsRule[] }> = [];
  let current: { agents: string[]; rules: RobotsRule[] } | null = null;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.replace(/#.*$/, '').trim();
    const separator = line.indexOf(':');
    if (separator < 0) continue;
    const key = line.slice(0, separator).trim().toLowerCase();
    const value = line.slice(separator + 1).trim();
    if (key === 'user-agent') {
      if (!current || current.rules.length) {
        current = { agents: [], rules: [] };
        groups.push(current);
      }
      current.agents.push(value.toLowerCase());
    } else if (current && (key === 'allow' || key === 'disallow') && value) {
      current.rules.push({ allow: key === 'allow', path: value });
    }
  }
  const bot = USER_AGENT.split(/[\/\s]/)[0].toLowerCase();
  const exact = groups.filter((group) => group.agents.some((agent) => bot.includes(agent) || agent === bot));
  const selected = exact.length ? exact : groups.filter((group) => group.agents.includes('*'));
  const url = new URL(target);
  const pathname = `${url.pathname}${url.search}`;
  const rules = selected.flatMap((group) => group.rules)
    .filter((rule) => robotsRuleMatches(rule.path, pathname))
    .sort((a, b) => b.path.replace(/\*/g, '').length - a.path.replace(/\*/g, '').length || Number(b.allow) - Number(a.allow));
  return rules[0]?.allow ?? true;
}

async function existingProducts(output: string): Promise<TechnoToolsProduct[]> {
  try {
    const raw = JSON.parse(await fs.readFile(output, 'utf8'));
    const products = Array.isArray(raw) ? raw : raw.products;
    return Array.isArray(products) ? products : [];
  } catch (error) {
    if ((error as NodeJS.ErrnoException)?.code !== 'ENOENT') {
      console.warn(`Export existant ignoré: ${messageOf(error)}`);
    }
    return [];
  }
}

async function writeAtomic(output: string, payload: unknown) {
  await fs.mkdir(path.dirname(output), { recursive: true });
  const temporary = `${output}.${process.pid}.tmp`;
  await fs.writeFile(temporary, JSON.stringify(payload, null, 2), 'utf8');
  await fs.rename(temporary, output);
}

function integer(value: number, fallback: number, minimum = 0) {
  return Number.isFinite(value) ? Math.max(minimum, Math.floor(value)) : fallback;
}

export async function scrapeTechnoTools({
  output = DEFAULT_OUTPUT,
  maxPages = Number(process.env.TECHNOTOOLS_MAX_PAGES || 20),
  maxProducts = Number(process.env.TECHNOTOOLS_MAX_PRODUCTS || 0),
  delayMs = Number(process.env.TECHNOTOOLS_DELAY_MS || 1600),
  startPage = Number(process.env.TECHNOTOOLS_START_PAGE || 1),
  categoryId = Number(process.env.TECHNOTOOLS_CATEGORY_ID || 115),
  indexId = process.env.TECHNOTOOLS_INDEX_ID || 'index-154740',
  retries = Number(process.env.TECHNOTOOLS_RETRIES || 4),
  timeoutMs = Number(process.env.TECHNOTOOLS_TIMEOUT_MS || 30_000),
  resume = process.env.TECHNOTOOLS_RESUME !== 'false',
  checkpointEvery = Number(process.env.TECHNOTOOLS_CHECKPOINT_EVERY || 10),
  defaultStock = Number(process.env.TECHNOTOOLS_DEFAULT_STOCK || 10),
}: ScrapeOptions = {}) {
  maxPages = integer(maxPages, 20, 1);
  maxProducts = integer(maxProducts, 0);
  delayMs = integer(delayMs, 1600);
  startPage = integer(startPage, 1, 1);
  categoryId = integer(categoryId, 115, 1);
  retries = integer(retries, 4, 1);
  timeoutMs = integer(timeoutMs, 30_000, 1000);
  checkpointEvery = integer(checkpointEvery, 10, 1);
  defaultStock = integer(defaultStock, 10);

  const errors: ScrapeError[] = [];
  const discovered: string[] = [];
  const seen = new Set<string>();
  const saved = resume ? await existingProducts(output) : [];
  const products = new Map(saved.filter((item) => item?.sourceUrl).map((item) => [item.sourceUrl, item]));

  let robots = '';
  try {
    robots = await fetchText(`${BASE_URL}/robots.txt`, 2, timeoutMs);
  } catch (error) {
    errors.push({ stage: 'robots', url: `${BASE_URL}/robots.txt`, message: messageOf(error), status: statusOf(error) });
    console.warn(`robots.txt non disponible: ${messageOf(error)}`);
  }

  let listingFailures = 0;
  for (let page = startPage; page < startPage + maxPages; page += 1) {
    const url = buildListingUrl(page, categoryId, indexId);
    if (robots && !robotsAllows(robots, url)) throw new Error(`Exploration interdite par robots.txt: ${url}`);
    console.log(`[listing ${page}] ${url}`);
    try {
      const html = await fetchText(url, retries, timeoutMs);
      const links = extractProductLinks(html, categoryId);
      const fresh = links.filter((link) => !seen.has(link));
      fresh.forEach((link) => {
        seen.add(link);
        discovered.push(link);
      });
      listingFailures = 0;
      if (!links.length || !fresh.length || (maxProducts && discovered.length >= maxProducts)) break;
      const hasNext = /class\s*=\s*(["'])page-next\1[\s\S]*?href\s*=\s*(["'])[^"']*upage=/i.test(html);
      if (!hasNext) break;
    } catch (error) {
      listingFailures += 1;
      errors.push({ stage: 'listing', url, message: messageOf(error), status: statusOf(error) });
      console.error(`  -> ${messageOf(error)}`);
      if (listingFailures >= 3) break;
    }
    await sleep(delayMs);
  }

  const selected = maxProducts ? discovered.slice(0, maxProducts) : discovered;
  let sinceCheckpoint = 0;
  for (let index = 0; index < selected.length; index += 1) {
    const url = selected[index];
    if (resume && products.has(url)) {
      console.log(`[product ${index + 1}/${selected.length}] déjà présent: ${url}`);
      continue;
    }
    if (robots && !robotsAllows(robots, url)) {
      errors.push({ stage: 'product', url, message: 'Exploration interdite par robots.txt' });
      continue;
    }
    try {
      console.log(`[product ${index + 1}/${selected.length}] ${url}`);
      const html = await fetchText(url, retries, timeoutMs);
      const product = parseProduct(html, url, defaultStock);
      const problems = validateProduct(product);
      const blocking = problems.filter((problem) => problem !== 'aucune image');
      if (blocking.length) throw new Error(`Produit incomplet: ${blocking.join(', ')}`);
      if (problems.includes('aucune image')) console.warn('  -> avertissement: aucune image');
      products.set(product.sourceUrl, product);
    } catch (error) {
      errors.push({ stage: 'product', url, message: messageOf(error), status: statusOf(error) });
      console.error(`  -> ${messageOf(error)}`);
    }
    sinceCheckpoint += 1;
    if (sinceCheckpoint >= checkpointEvery) {
      sinceCheckpoint = 0;
      await writeAtomic(output, {
        source: BASE_URL,
        listingUrl: buildListingUrl(1, categoryId, indexId),
        generatedAt: new Date().toISOString(),
        complete: false,
        productCount: products.size,
        errorCount: errors.length,
        products: [...products.values()],
        errors,
      });
    }
    await sleep(delayMs);
  }

  const payload = {
    source: BASE_URL,
    listingUrl: buildListingUrl(1, categoryId, indexId),
    generatedAt: new Date().toISOString(),
    complete: true,
    resumed: resume,
    discoveredCount: selected.length,
    productCount: products.size,
    errorCount: errors.length,
    products: [...products.values()],
    errors,
  };
  await writeAtomic(output, payload);
  console.log(`Export terminé: ${products.size} produits, ${errors.length} erreurs -> ${output}`);
  return payload;
}

const entryPoint = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : '';
if (entryPoint && import.meta.url === entryPoint) {
  scrapeTechnoTools().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
