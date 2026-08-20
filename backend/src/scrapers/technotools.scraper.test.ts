import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildListingUrl,
  extractProductLinks,
  parseProduct,
  validateProduct,
} from './technotools.scraper.ts';

const productHtml = `
<html><head>
  <link rel="canonical" href="https://technotools.tn/produit/perceuse-test/">
  <script type="application/ld+json">{
    "@context":"https://schema.org/", "@type":"Product",
    "name":"Perceuse INGCO 20V", "url":"https://technotools.tn/produit/perceuse-test/",
    "description":"Perceuse professionnelle.", "image":"https://technotools.tn/uploads/perceuse.webp",
    "sku":"CIDLI-001", "brand":{"@type":"Brand","name":"INGCO"},
    "offers":[{"@type":"Offer","price":"149.000","priceCurrency":"TND","availability":"https://schema.org/InStock"}]
  }</script>
</head><body>
  <div id="product-123" class="product instock featured">
    <div class="woocommerce-product-gallery"><a href="/uploads/perceuse-large.png"><img data-large_image="/uploads/perceuse-large.png"></a></div>
    <h1 class="product_title entry-title">Perceuse INGCO 20V</h1>
    <span class="price"><del>TND 169,000</del><ins>TND 149,000</ins></span>
    <div class="product_meta">
      <span class="sku">CIDLI-001</span>
      <span class="posted_in"><a href="/categorie-produit/outillage-electrique/">Outillage électrique</a>, <a href="/categorie-produit/outillage-electrique/perceuse/">Perceuse</a></span>
      <span class="branded_as"><a href="/marque/ingco/">INGCO</a></span>
    </div>
    <div id="tab-description-123"><p>Description locale.</p></div>
  </div>
</body></html>`;

test('construit la pagination TechnoTools demandée', () => {
  assert.equal(buildListingUrl(1), 'https://technotools.tn/?id=index-154740&ucat=115');
  assert.equal(buildListingUrl(2), 'https://technotools.tn/?id=index-154740&ucat=115&upage=2');
});

test('ne conserve que les cartes appartenant à ucat=115', () => {
  const html = `
    <div class="tmb grid-cat-115 tmb-id-1"><a href="https://technotools.tn/produit/ingco-a/">A</a></div>
    <div class="tmb grid-cat-119 tmb-id-2"><a href="https://technotools.tn/produit/dewalt-b/">B</a></div>
    <div class="isotope-footer"></div>`;
  assert.deepEqual(extractProductLinks(html), ['https://technotools.tn/produit/ingco-a/']);
});

test('convertit une fiche WooCommerce au format import V8', () => {
  const product = parseProduct(productHtml, 'https://technotools.tn/produit/perceuse-test/', 8);
  assert.equal(product.name, 'Perceuse INGCO 20V');
  assert.equal(product.price, 149);
  assert.equal(product.oldPrice, 169);
  assert.equal(product.stock, 8);
  assert.equal(product.stockEstimated, true);
  assert.equal(product.sourceCategoryName, 'Perceuse');
  assert.equal(product.sourceCategorySlug, 'perceuse');
  assert.equal(product.sku, 'CIDLI-001');
  assert.equal(product.featured, true);
  assert.equal(product.images.includes('https://technotools.tn/uploads/perceuse-large.png'), true);
  assert.deepEqual(validateProduct(product), []);
});

test('met le stock à zéro pour une fiche en rupture', () => {
  const html = productHtml.replaceAll('instock', 'outofstock').replace('schema.org/InStock', 'schema.org/OutOfStock');
  const product = parseProduct(html, 'https://technotools.tn/produit/perceuse-test/');
  assert.equal(product.stock, 0);
  assert.equal(product.availability, 'out_of_stock');
  assert.equal(product.stockEstimated, false);
});
