import assert from 'node:assert/strict';
import test from 'node:test';
import { buildListingUrl, extractProductLinks } from './technotools.scraper.ts';

test('construit l’URL DYLLU ucat=135', () => {
  assert.equal(
    buildListingUrl(1, 135),
    'https://technotools.tn/?id=index-154740&ucat=135',
  );
  assert.equal(
    buildListingUrl(2, 135),
    'https://technotools.tn/?id=index-154740&ucat=135&upage=2',
  );
});

test('isole les produits DYLLU dans une grille mixte', () => {
  const html = `
    <div class="tmb grid-cat-135 tmb-id-1"><a href="https://technotools.tn/produit/dyllu-a/">DYLLU</a></div>
    <div class="tmb grid-cat-115 tmb-id-2"><a href="https://technotools.tn/produit/ingco-b/">INGCO</a></div>
    <div class="isotope-footer"></div>`;
  assert.deepEqual(
    extractProductLinks(html, 135),
    ['https://technotools.tn/produit/dyllu-a/'],
  );
});
