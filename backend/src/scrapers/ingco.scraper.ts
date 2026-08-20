import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

type JsonObject = Record<string, any>;

type ScrapedProduct = {
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

type FetchOptions = {
  retries?: number;
  timeoutMs?: number;
};

type ScrapeOptions = {
  output?: string;
  maxPages?: number;
  maxProducts?: number;
  delayMs?: number;
  startPage?: number;
  retries?: number;
  timeoutMs?: number;
  resume?: boolean;
  checkpointEvery?: number;
  defaultStock?: number;
};

const BASE_URL = new URL(process.env.INGCO_BASE_URL || 'https://ingco.tn').origin;
const DEFAULT_OUTPUT = path.resolve(process.env.INGCO_OUTPUT || 'data/ingco-products.json');
const USER_AGENT = process.env.INGCO_USER_AGENT || 'BencirCatalogueBot/2.0 (+catalogue import; respectful rate limiting)';
const MAX_RESPONSE_BYTES = 8 * 1024 * 1024;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, Math.max(0, ms)));

export function decodeEntities(value = '') {
  const named: Record<string, string> = {
    amp: '&',
    quot: '"',
    apos: "'",
    lt: '<',
    gt: '>',
    nbsp: ' ',
    ndash: '–',
    mdash: '—',
    hellip: '…',
    rsquo: '’',
    lsquo: '‘',
    laquo: '«',
    raquo: '»',
  };

  return String(value)
    .replace(/&#(\d+);/g, (match, number) => safeCodePoint(match, Number(number)))
    .replace(/&#x([0-9a-f]+);/gi, (match, number) => safeCodePoint(match, Number.parseInt(number, 16)))
    .replace(/&([a-z]+);/gi, (match, name) => named[name.toLowerCase()] ?? match);
}

function safeCodePoint(fallback: string, value: number) {
  try {
    return Number.isInteger(value) && value >= 0 && value <= 0x10ffff
      ? String.fromCodePoint(value)
      : fallback;
  } catch {
    return fallback;
  }
}

export function stripTags(value = '') {
  return decodeEntities(
    String(value)
      .replace(/<br\s*\/?\s*>/gi, '\n')
      .replace(/<\/(?:p|li|h[1-6]|tr)>/gi, '\n')
      .replace(/<[^>]+>/g, ' ')
  )
    .replace(/[ \t]+/g, ' ')
    .replace(/\s*\n\s*/g, '\n')
    .replace(/\s+([,.;:!?])/g, '$1')
    .trim();
}

export function slugify(value = '') {
  return String(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

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

function sourceUrl(value = '') {
  const resolved = absoluteUrl(value);
  if (!resolved) return '';
  try {
    const url = new URL(resolved);
    if (url.origin !== BASE_URL) return '';
    url.search = '';
    url.pathname = url.pathname.replace(/\/{2,}/g, '/');
    return url.href;
  } catch {
    return '';
  }
}

function unique<T>(values: T[]) {
  return [...new Set(values.filter(Boolean))];
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function errorStatus(error: unknown) {
  return typeof (error as { status?: unknown })?.status === 'number'
    ? (error as { status: number }).status
    : undefined;
}

function retryAfterMs(value: string | null) {
  if (!value) return 0;
  const seconds = Number(value);
  if (Number.isFinite(seconds)) return Math.max(0, seconds * 1000);
  const date = Date.parse(value);
  return Number.isFinite(date) ? Math.max(0, date - Date.now()) : 0;
}

async function fetchText(url: string, { retries = 4, timeoutMs = 25_000 }: FetchOptions = {}) {
  let lastError: unknown = new Error(`Impossible de charger ${url}`);

  for (let attempt = 1; attempt <= Math.max(1, retries); attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        headers: {
          'user-agent': USER_AGENT,
          accept: 'text/html,application/xhtml+xml,application/json;q=0.8,text/plain;q=0.7',
          'accept-language': 'fr-TN,fr;q=0.9,en;q=0.5',
        },
        redirect: 'follow',
        signal: controller.signal,
      });

      const finalUrl = new URL(response.url);
      if (finalUrl.origin !== BASE_URL) {
        throw new Error(`Redirection refusée vers un autre domaine: ${response.url}`);
      }

      if (!response.ok) {
        const httpError = Object.assign(new Error(`HTTP ${response.status} pour ${url}`), {
          status: response.status,
          retryAfter: retryAfterMs(response.headers.get('retry-after')),
        });
        throw httpError;
      }

      const contentLength = Number(response.headers.get('content-length') || 0);
      if (contentLength > MAX_RESPONSE_BYTES) {
        throw new Error(`Réponse trop volumineuse (${contentLength} octets) pour ${url}`);
      }

      const text = await response.text();
      if (Buffer.byteLength(text, 'utf8') > MAX_RESPONSE_BYTES) {
        throw new Error(`Réponse trop volumineuse pour ${url}`);
      }
      return text;
    } catch (error) {
      lastError = error;
      const status = errorStatus(error);
      const retryable = !status || status === 408 || status === 425 || status === 429 || status >= 500;
      if (!retryable || attempt >= retries) break;

      const serverDelay = Number((error as { retryAfter?: number })?.retryAfter || 0);
      const backoff = Math.min(15_000, 700 * (2 ** (attempt - 1)));
      const jitter = Math.floor(Math.random() * 250);
      await sleep(Math.max(serverDelay, backoff + jitter));
    } finally {
      clearTimeout(timer);
    }
  }

  throw lastError;
}

export function extractProductLinks(html: string) {
  const links: string[] = [];
  const regex = /<a\b[^>]*\bhref\s*=\s*(["'])(.*?)\1[^>]*>/gi;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(html))) {
    const url = sourceUrl(match[2]);
    if (url && /\/produit\/[^/?#]+\/?$/i.test(new URL(url).pathname)) links.push(url);
  }
  return unique(links);
}

function cleanJsonLd(value: string) {
  return value
    .trim()
    .replace(/^<!--/, '')
    .replace(/-->$/, '')
    .replace(/^\/\*<!\[CDATA\[\*\//, '')
    .replace(/\/\*\]\]>\*\/$/, '')
    .trim();
}

export function extractJsonLd(html: string) {
  const blocks: unknown[] = [];
  const regex = /<script\b[^>]*\btype\s*=\s*(["'])application\/ld\+json(?:\s*;\s*charset=[^"']+)?\1[^>]*>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(html))) {
    const raw = cleanJsonLd(match[2]);
    const candidates = unique([raw, decodeEntities(raw)]);
    for (const candidate of candidates) {
      try {
        blocks.push(JSON.parse(candidate));
        break;
      } catch {
        // Certains thèmes WordPress produisent un bloc invalide : les autres sources restent disponibles.
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

function hasSchemaType(node: JsonObject, expected: string) {
  const type = node?.['@type'];
  return type === expected || (Array.isArray(type) && type.includes(expected));
}

function findProductSchema(html: string) {
  const nodes = extractJsonLd(html).flatMap((block) => flattenJsonLd(block));
  return nodes.find((node) => hasSchemaType(node, 'Product')) || {};
}

export function parsePrice(value: unknown) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;

  let normalized = String(value ?? '')
    .replace(/[\u00a0\u202f\s']/g, '')
    .replace(/[^\d,.-]/g, '');

  const negative = normalized.startsWith('-');
  normalized = normalized.replace(/-/g, '');
  if (!normalized) return 0;

  const comma = normalized.lastIndexOf(',');
  const dot = normalized.lastIndexOf('.');
  const decimalIndex = Math.max(comma, dot);

  if (decimalIndex >= 0) {
    const separator = normalized[decimalIndex];
    const fractionLength = normalized.length - decimalIndex - 1;
    const separatorCount = normalized.split(separator).length - 1;
    const otherSeparator = separator === ',' ? '.' : ',';

    if (normalized.includes(otherSeparator) || separatorCount === 1 || fractionLength < 3) {
      const integerPart = normalized.slice(0, decimalIndex).replace(/[.,]/g, '');
      const fractionPart = normalized.slice(decimalIndex + 1).replace(/[.,]/g, '');
      normalized = fractionPart ? `${integerPart}.${fractionPart}` : integerPart;
    } else {
      normalized = normalized.replace(/[.,]/g, '');
    }
  }

  const number = Number.parseFloat(normalized);
  if (!Number.isFinite(number)) return 0;
  return negative ? -number : number;
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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
  const match = /<link\b[^>]*\brel\s*=\s*(["'])canonical\1[^>]*\bhref\s*=\s*(["'])(.*?)\2|<link\b[^>]*\bhref\s*=\s*(["'])(.*?)\4[^>]*\brel\s*=\s*(["'])canonical\6/i.exec(html);
  return sourceUrl(match?.[3] || match?.[5] || extractMeta(html, 'og:url'));
}

function extractBalancedDiv(html: string, openingPattern: RegExp) {
  const opening = openingPattern.exec(html);
  if (!opening) return '';

  const contentStart = opening.index + opening[0].length;
  const tagRegex = /<\/?div\b[^>]*>/gi;
  tagRegex.lastIndex = contentStart;
  let depth = 1;
  let tag: RegExpExecArray | null;

  while ((tag = tagRegex.exec(html))) {
    if (/^<\//.test(tag[0])) depth -= 1;
    else depth += 1;
    if (depth === 0) return html.slice(contentStart, tag.index);
  }
  return html.slice(contentStart);
}

function extractBreadcrumbCategory(html: string) {
  const nodes = extractJsonLd(html).flatMap((block) => flattenJsonLd(block));
  const breadcrumb = nodes.find((node) => hasSchemaType(node, 'BreadcrumbList'));
  const items = Array.isArray(breadcrumb?.itemListElement) ? breadcrumb.itemListElement : [];
  const candidates = items
    .map((entry: JsonObject) => {
      const item = typeof entry?.item === 'object' ? entry.item : {};
      const url = sourceUrl(item?.['@id'] || item?.url || entry?.item || '');
      return { name: stripTags(entry?.name || item?.name || ''), url };
    })
    .filter((entry: { name: string; url: string }) => entry.name && /\/categorie-produit\//i.test(entry.url));
  return candidates.at(-1);
}

function extractCategory(html: string, schema: JsonObject) {
  const schemaCategory = stripTags(schema.category || '');
  const categoryMatch = /(?:posted_in|Cat[ée]gorie(?:s)?)\b[\s\S]{0,300}?<a\b[^>]*href\s*=\s*(["'])([^"']*\/categorie-produit\/[^"']+)\1[^>]*>([\s\S]*?)<\/a>/i.exec(html);
  const breadcrumb = extractBreadcrumbCategory(html);
  const href = sourceUrl(categoryMatch?.[2] || breadcrumb?.url || '');
  const name = schemaCategory || stripTags(categoryMatch?.[3] || breadcrumb?.name || '');
  const sourceSlug = href.match(/\/categorie-produit\/([^/]+)/i)?.[1] || slugify(name);
  return { name, sourceSlug: decodeURIComponent(sourceSlug) };
}

function schemaImageUrls(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.flatMap(schemaImageUrls);
  if (typeof value === 'string') return [absoluteUrl(value)];
  if (typeof value === 'object') {
    const image = value as JsonObject;
    return [absoluteUrl(image.url || image.contentUrl || image.thumbnailUrl || '')];
  }
  return [];
}

function imageCandidatesFromTag(tag: string) {
  const values: string[] = [];
  const attrRegex = /\b(?:data-large_image|data-src|data-lazy-src|src)\s*=\s*(["'])(.*?)\1/gi;
  let attr: RegExpExecArray | null;
  while ((attr = attrRegex.exec(tag))) values.push(attr[2]);

  const srcsetRegex = /\b(?:data-srcset|srcset)\s*=\s*(["'])(.*?)\1/gi;
  while ((attr = srcsetRegex.exec(tag))) {
    attr[2].split(',').forEach((candidate) => values.push(candidate.trim().split(/\s+/)[0]));
  }
  return values;
}

function isSupportedImage(url: string) {
  try {
    const parsed = new URL(url);
    return /^https?:$/.test(parsed.protocol) && /\.(?:avif|gif|jpe?g|png|webp)$/i.test(parsed.pathname);
  } catch {
    return false;
  }
}

function extractGalleryImages(html: string, schema: JsonObject) {
  const htmlImages: string[] = [];
  const tags = html.match(/<(?:img|a)\b[^>]*>/gi) || [];
  tags.forEach((tag) => {
    if (/data-large_image|wp-post-image|woocommerce-product-gallery__image/i.test(tag)) {
      imageCandidatesFromTag(tag).forEach((image) => htmlImages.push(absoluteUrl(image)));
      const href = /\bhref\s*=\s*(["'])(.*?)\1/i.exec(tag)?.[2];
      if (href) htmlImages.push(absoluteUrl(href));
    }
  });

  return unique([
    ...schemaImageUrls(schema.image),
    ...htmlImages,
    absoluteUrl(extractMeta(html, 'og:image')),
    absoluteUrl(extractMeta(html, 'twitter:image')),
  ]).filter(isSupportedImage);
}

function extractDescription(html: string, schema: JsonObject) {
  const schemaDescription = stripTags(schema.description || '');
  if (schemaDescription) return schemaDescription;

  const description = extractBalancedDiv(
    html,
    /<div\b[^>]*(?:id\s*=\s*["']tab-description["']|class\s*=\s*["'][^"']*woocommerce-Tabs-panel--description[^"']*["'])[^>]*>/i,
  );
  return stripTags(description);
}

function getOffers(schema: JsonObject) {
  const offers = Array.isArray(schema.offers) ? schema.offers : [schema.offers];
  return offers.filter((offer) => offer && typeof offer === 'object');
}

function offerPrice(offers: JsonObject[]) {
  const values = offers
    .flatMap((offer) => [offer.price, offer.lowPrice, offer.highPrice])
    .map(parsePrice)
    .filter((price) => price > 0);
  return values.length ? Math.min(...values) : 0;
}

function extractHtmlPrice(html: string) {
  const priceBlock = /<(?:p|span)\b[^>]*class\s*=\s*(["'])[^"']*\bprice\b[^"']*\1[^>]*>([\s\S]*?)<\/(?:p|span)>/i.exec(html)?.[2] || '';
  const current = /<ins\b[^>]*>([\s\S]*?)<\/ins>/i.exec(priceBlock)?.[1] || priceBlock;
  const bdi = /<bdi\b[^>]*>([\s\S]*?)<\/bdi>/i.exec(current)?.[1] || current;
  return parsePrice(stripTags(bdi));
}

function extractOldPrice(html: string) {
  const oldPrice = /<del\b[^>]*>([\s\S]*?)<\/del>/i.exec(html)?.[1] || '';
  const bdi = /<bdi\b[^>]*>([\s\S]*?)<\/bdi>/i.exec(oldPrice)?.[1] || oldPrice;
  return parsePrice(stripTags(bdi));
}

function determineAvailability(html: string, offers: JsonObject[]) {
  const values = offers.map((offer) => String(offer.availability || '').toLowerCase());
  if (values.some((value) => /outofstock|soldout|discontinued/.test(value))) return false;
  if (values.some((value) => /instock|preorder|onlineonly|limitedavailability/.test(value))) return true;
  if (/\b(?:out-of-stock|rupture\s+de\s+stock|épuisé|indisponible)\b/i.test(html)) return false;
  return true;
}

export function parseProduct(html: string, url: string, defaultStock = 10): ScrapedProduct {
  const schema = findProductSchema(html);
  const offers = getOffers(schema);
  const category = extractCategory(html, schema);
  const titleMatch = /<h1\b[^>]*class\s*=\s*(["'])[^"']*product_title[^"']*\1[^>]*>([\s\S]*?)<\/h1>/i.exec(html);
  const name = stripTags(schema.name || titleMatch?.[2] || extractMeta(html, 'og:title'));
  const price = offerPrice(offers) || extractHtmlPrice(html);
  const extractedOldPrice = extractOldPrice(html);
  const inStock = determineAvailability(html, offers);
  const skuMatch = /class\s*=\s*(["'])[^"']*\bsku\b[^"']*\1[^>]*>([\s\S]*?)<\/span>/i.exec(html);
  const sku = stripTags(schema.sku || schema.mpn || skuMatch?.[2] || '');
  const description = extractDescription(html, schema);
  const shortHtml = extractBalancedDiv(
    html,
    /<div\b[^>]*class\s*=\s*(["'])[^"']*woocommerce-product-details__short-description[^"']*\1[^>]*>/i,
  );
  const shortDescription = stripTags(shortHtml || description).slice(0, 260);
  const images = extractGalleryImages(html, schema);
  const canonical = extractCanonical(html) || sourceUrl(url);
  const slug = new URL(canonical || url).pathname.match(/\/produit\/([^/]+)/i)?.[1] || slugify(name);
  const rating = Number(schema.aggregateRating?.ratingValue ?? 0);
  const reviews = Number(schema.aggregateRating?.reviewCount ?? schema.aggregateRating?.ratingCount ?? 0);
  const stock = inStock ? Math.max(0, Math.floor(defaultStock)) : 0;

  return {
    name,
    slug: decodeURIComponent(slug),
    description: description || (name ? `${name} — produit professionnel INGCO.` : ''),
    shortDescription,
    price,
    oldPrice: extractedOldPrice > price ? extractedOldPrice : 0,
    stock,
    stockEstimated: inStock,
    availability: inStock ? 'in_stock' : 'out_of_stock',
    images,
    sku,
    brand: stripTags(schema.brand?.name || schema.brand || 'INGCO') || 'INGCO',
    rating: Number.isFinite(rating) ? Math.min(Math.max(rating, 0), 5) : 0,
    reviews: Number.isFinite(reviews) ? Math.max(0, Math.floor(reviews)) : 0,
    tags: unique(['INGCO', category.name, sku]).filter(Boolean),
    featured: false,
    isActive: true,
    sourceName: new URL(BASE_URL).hostname,
    sourceUrl: canonical || sourceUrl(url),
    sourceExternalId: String(schema.productID || schema.mpn || sku || slug),
    sourceCategoryName: category.name,
    sourceCategorySlug: category.sourceSlug,
    importedAt: new Date().toISOString(),
  };
}

export function validateProduct(product: ScrapedProduct) {
  const problems: string[] = [];
  if (!product.name) problems.push('nom absent');
  if (!product.slug) problems.push('slug absent');
  if (!Number.isFinite(product.price) || product.price <= 0) problems.push('prix absent ou invalide');
  if (!product.sourceUrl) problems.push('URL source absente ou hors domaine');
  if (!product.images.length) problems.push('aucune image');
  return problems;
}

type RobotsRule = { allow: boolean; path: string };

function parseRobotsGroups(text: string) {
  const groups: Array<{ agents: string[]; rules: RobotsRule[] }> = [];
  let current: { agents: string[]; rules: RobotsRule[] } | null = null;

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.replace(/#.*$/, '').trim();
    if (!line) continue;
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
  return groups;
}

function robotsAllows(text: string, targetUrl: string) {
  const botName = USER_AGENT.split(/[\/\s]/)[0].toLowerCase();
  const groups = parseRobotsGroups(text);
  const exact = groups.filter((group) => group.agents.some((agent) => botName.includes(agent) || agent === botName));
  const selected = exact.length ? exact : groups.filter((group) => group.agents.includes('*'));
  const pathname = `${new URL(targetUrl).pathname}${new URL(targetUrl).search}`;
  const matching = selected
    .flatMap((group) => group.rules)
    .filter((rule) => pathname.startsWith(rule.path.replace(/\*.*$/, '')))
    .sort((a, b) => b.path.length - a.path.length || Number(b.allow) - Number(a.allow));
  return matching[0]?.allow ?? true;
}

async function readExistingOutput(output: string): Promise<ScrapedProduct[]> {
  try {
    const raw = JSON.parse(await fs.readFile(output, 'utf8'));
    const products = Array.isArray(raw) ? raw : raw.products;
    return Array.isArray(products) ? products : [];
  } catch (error) {
    if ((error as NodeJS.ErrnoException)?.code !== 'ENOENT') {
      console.warn(`Export existant ignoré: ${errorMessage(error)}`);
    }
    return [];
  }
}

async function writeJsonAtomic(output: string, payload: unknown) {
  await fs.mkdir(path.dirname(output), { recursive: true });
  const temp = `${output}.${process.pid}.tmp`;
  await fs.writeFile(temp, JSON.stringify(payload, null, 2), 'utf8');
  await fs.rename(temp, output);
}

function positiveInteger(value: number, fallback: number, minimum = 0) {
  return Number.isFinite(value) ? Math.max(minimum, Math.floor(value)) : fallback;
}

export async function scrapeIngco({
  output = DEFAULT_OUTPUT,
  maxPages = Number(process.env.INGCO_MAX_PAGES || 40),
  maxProducts = Number(process.env.INGCO_MAX_PRODUCTS || 0),
  delayMs = Number(process.env.INGCO_DELAY_MS || 1400),
  startPage = Number(process.env.INGCO_START_PAGE || 1),
  retries = Number(process.env.INGCO_RETRIES || 4),
  timeoutMs = Number(process.env.INGCO_TIMEOUT_MS || 25_000),
  resume = process.env.INGCO_RESUME !== 'false',
  checkpointEvery = Number(process.env.INGCO_CHECKPOINT_EVERY || 10),
  defaultStock = Number(process.env.INGCO_DEFAULT_STOCK || 10),
}: ScrapeOptions = {}) {
  maxPages = positiveInteger(maxPages, 40, 1);
  maxProducts = positiveInteger(maxProducts, 0);
  delayMs = positiveInteger(delayMs, 1400);
  startPage = positiveInteger(startPage, 1, 1);
  retries = positiveInteger(retries, 4, 1);
  timeoutMs = positiveInteger(timeoutMs, 25_000, 1000);
  checkpointEvery = positiveInteger(checkpointEvery, 10, 1);
  defaultStock = positiveInteger(defaultStock, 10);

  const productLinks: string[] = [];
  const seenLinks = new Set<string>();
  const errors: ScrapeError[] = [];
  const existingProducts = resume ? await readExistingOutput(output) : [];
  const productsByUrl = new Map<string, ScrapedProduct>(
    existingProducts.filter((product) => product?.sourceUrl).map((product) => [product.sourceUrl, product]),
  );

  let robotsText = '';
  try {
    robotsText = await fetchText(`${BASE_URL}/robots.txt`, { retries: 2, timeoutMs });
  } catch (error) {
    errors.push({ stage: 'robots', url: `${BASE_URL}/robots.txt`, message: errorMessage(error), status: errorStatus(error) });
    console.warn(`robots.txt non disponible: ${errorMessage(error)}`);
  }

  let consecutiveListingErrors = 0;
  let previousPageSignature = '';

  for (let page = startPage; page < startPage + maxPages; page += 1) {
    const pageUrl = page === 1 ? `${BASE_URL}/boutique/` : `${BASE_URL}/boutique/page/${page}/`;
    if (robotsText && !robotsAllows(robotsText, pageUrl)) {
      throw new Error(`Exploration interdite par robots.txt: ${pageUrl}`);
    }

    console.log(`[listing ${page - startPage + 1}/${maxPages}] ${pageUrl}`);
    try {
      const html = await fetchText(pageUrl, { retries, timeoutMs });
      const allLinks = extractProductLinks(html);
      const signature = allLinks.join('|');
      if (!allLinks.length || signature === previousPageSignature) break;
      previousPageSignature = signature;

      const newLinks = allLinks.filter((link) => !seenLinks.has(link));
      newLinks.forEach((link) => {
        seenLinks.add(link);
        productLinks.push(link);
      });
      consecutiveListingErrors = 0;
      if (!newLinks.length || (maxProducts && productLinks.length >= maxProducts)) break;
    } catch (error) {
      consecutiveListingErrors += 1;
      errors.push({ stage: 'listing', url: pageUrl, message: errorMessage(error), status: errorStatus(error) });
      console.error(`  -> ${errorMessage(error)}`);
      if (consecutiveListingErrors >= 3) break;
    }
    await sleep(delayMs);
  }

  const selectedLinks = maxProducts ? productLinks.slice(0, maxProducts) : productLinks;
  let processedSinceCheckpoint = 0;

  for (let index = 0; index < selectedLinks.length; index += 1) {
    const url = selectedLinks[index];
    if (resume && productsByUrl.has(url)) {
      console.log(`[product ${index + 1}/${selectedLinks.length}] déjà présent: ${url}`);
      continue;
    }
    if (robotsText && !robotsAllows(robotsText, url)) {
      errors.push({ stage: 'product', url, message: 'Exploration interdite par robots.txt' });
      continue;
    }

    try {
      console.log(`[product ${index + 1}/${selectedLinks.length}] ${url}`);
      const html = await fetchText(url, { retries, timeoutMs });
      const product = parseProduct(html, url, defaultStock);
      const problems = validateProduct(product);
      const blocking = problems.filter((problem) => problem !== 'aucune image');
      if (blocking.length) throw new Error(`Produit incomplet: ${blocking.join(', ')}`);
      if (problems.includes('aucune image')) console.warn('  -> avertissement: aucune image');
      productsByUrl.set(product.sourceUrl, product);
    } catch (error) {
      errors.push({ stage: 'product', url, message: errorMessage(error), status: errorStatus(error) });
      console.error(`  -> ${errorMessage(error)}`);
    }

    processedSinceCheckpoint += 1;
    if (processedSinceCheckpoint >= checkpointEvery) {
      processedSinceCheckpoint = 0;
      const checkpointProducts = [...productsByUrl.values()];
      await writeJsonAtomic(output, {
        source: BASE_URL,
        generatedAt: new Date().toISOString(),
        complete: false,
        productCount: checkpointProducts.length,
        errorCount: errors.length,
        products: checkpointProducts,
        errors,
      });
    }
    await sleep(delayMs);
  }

  const products = [...productsByUrl.values()];
  const payload = {
    source: BASE_URL,
    generatedAt: new Date().toISOString(),
    complete: true,
    resumed: resume,
    discoveredCount: selectedLinks.length,
    productCount: products.length,
    errorCount: errors.length,
    products,
    errors,
  };

  await writeJsonAtomic(output, payload);
  console.log(`Export terminé: ${products.length} produits, ${errors.length} erreurs -> ${output}`);
  return payload;
}

const entryPoint = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : '';
if (entryPoint && import.meta.url === entryPoint) {
  scrapeIngco().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
