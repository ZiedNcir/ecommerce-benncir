import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildCatalogueProductPayload,
  buildDylluProductPayload,
  slugCandidate,
  sourceIdentity,
  validateCatalogueSource,
  validateDylluSource,
} from './catalogueImport.utils.ts';
import { getImportProfile } from './catalogueImport.config.ts';

const source = {
  name: 'Visseuse DYLLU 20V',
  slug: 'visseuse-dyllu-20v',
  price: 319,
  oldPrice: 349,
  stock: 10,
  images: ['https://technotools.tn/uploads/a.webp', 'javascript:alert(1)'],
  sku: '8720',
  brand: 'DYLLU',
  rating: 7,
  reviews: -3,
  sourceName: 'technotools.tn',
  sourceUrl: 'https://technotools.tn/produit/visseuse-dyllu-20v/',
  sourceExternalId: '8720',
};

test('valide une source DYLLU TechnoTools', () => {
  assert.deepEqual(validateDylluSource(source), []);
  assert.ok(validateDylluSource({ ...source, brand: 'INGCO' }).includes('marque inattendue: INGCO'));
  assert.ok(validateDylluSource({ ...source, sourceUrl: 'https://example.com/a' }).includes('URL source hors technotools.tn'));
});

test('construit un produit compatible avec le modèle MongoDB', () => {
  const payload = buildDylluProductPayload(source, ['child', 'parent'], 'child');
  assert.equal(payload.name, 'Visseuse DYLLU 20V');
  assert.equal(payload.oldPrice, 349);
  assert.equal(payload.rating, 5);
  assert.equal(payload.reviews, 0);
  assert.deepEqual(payload.images, ['https://technotools.tn/uploads/a.webp']);
  assert.deepEqual(payload.categories, ['child', 'parent']);
  assert.equal(payload.publicationStatus, 'published');
});

test('utilise l’URL source comme identité prioritaire', () => {
  assert.deepEqual(sourceIdentity(source), {
    sourceUrl: 'https://technotools.tn/produit/visseuse-dyllu-20v/',
  });
});

test('valide séparément INGCO TechnoTools et INGCO natif', () => {
  const technotools = getImportProfile('technotools');
  const ingco = getImportProfile('ingco');
  const ingcoSource = { ...source, brand: 'INGCO' };
  assert.deepEqual(validateCatalogueSource(ingcoSource, technotools), []);
  assert.ok(validateCatalogueSource(ingcoSource, ingco).some((error) => error.startsWith('URL source hors')));
  assert.throws(() => getImportProfile('inconnu'), /Profil inconnu/);
});

test('construit un payload générique et un slug de secours stable', () => {
  const payload = buildCatalogueProductPayload(
    { ...source, brand: 'INGCO' }, ['child'], 'child',
    { defaultBrand: 'INGCO', defaultSourceName: 'technotools.tn' },
    'visseuse-dyllu-20v-ingco-8720',
  );
  assert.equal(payload.slug, 'visseuse-dyllu-20v-ingco-8720');
  assert.equal(payload.brand, 'INGCO');
  assert.equal(slugCandidate({ ...source, brand: 'INGCO' }, 0), 'visseuse-dyllu-20v');
  assert.equal(slugCandidate({ ...source, brand: 'INGCO' }, 1), 'visseuse-dyllu-20v-ingco-8720');
});
