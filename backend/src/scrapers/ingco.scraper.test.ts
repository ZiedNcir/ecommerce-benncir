import assert from 'node:assert/strict';
import test from 'node:test';
import {
  decodeEntities,
  extractJsonLd,
  extractProductLinks,
  parsePrice,
  parseProduct,
  stripTags,
  validateProduct,
} from './ingco.scraper.ts';

const productHtml = `
<!doctype html>
<html>
  <head>
    <link href="https://ingco.tn/produit/perceuse-test/" rel="canonical">
    <meta content="https://ingco.tn/uploads/perceuse.webp" property="og:image">
    <script type="application/ld+json">
      {
        "@context": "https://schema.org",
        "@graph": [{
          "@type": "Product",
          "name": "Perceuse &amp; visseuse",
          "sku": "CDLI-001",
          "brand": {"@type": "Brand", "name": "INGCO"},
          "image": {"url": "https://ingco.tn/uploads/perceuse.jpg"},
          "offers": {"@type": "Offer", "price": "1.234,500", "availability": "https://schema.org/InStock"},
          "aggregateRating": {"ratingValue": "4.7", "reviewCount": "12"}
        }]
      }
    </script>
  </head>
  <body>
    <div class="woocommerce-product-details__short-description"><p>Courte <strong>description</strong>.</p></div>
    <div id="tab-description"><p>Description complète.</p><div><p>Bloc imbriqué.</p></div></div>
    <span class="posted_in">Catégorie: <a href="/categorie-produit/outillage-electroportatif/">Électroportatif</a></span>
    <div class="woocommerce-product-gallery__image"><a href="/uploads/perceuse-large.png"><img class="wp-post-image" src="/uploads/perceuse-small.jpg" srcset="/uploads/perceuse-small.jpg 300w, /uploads/perceuse-large.png 900w"></a></div>
  </body>
</html>`;

test('parse correctement les prix tunisiens et internationaux', () => {
  assert.equal(parsePrice('117,000 TND'), 117);
  assert.equal(parsePrice('1.234,500 DT'), 1234.5);
  assert.equal(parsePrice('1,234.50'), 1234.5);
  assert.equal(parsePrice(89.9), 89.9);
  assert.equal(parsePrice('indisponible'), 0);
});

test('préserve un JSON-LD contenant des entités HTML', () => {
  const blocks = extractJsonLd(productHtml);
  assert.equal(blocks.length, 1);
  assert.equal((blocks[0] as any)['@graph'][0].name, 'Perceuse &amp; visseuse');
});

test('extrait et normalise uniquement les liens produits du domaine source', () => {
  const links = extractProductLinks(`
    <a href="/produit/a/?tracking=1">A</a>
    <a href="https://ingco.tn/produit/a/#photo">A bis</a>
    <a href="https://example.com/produit/piege/">Externe</a>
    <a href="/categorie-produit/outils/">Catégorie</a>
  `);
  assert.deepEqual(links, ['https://ingco.tn/produit/a/']);
});

test('extrait un produit complet avec contenu imbriqué et galerie', () => {
  const product = parseProduct(productHtml, 'https://ingco.tn/produit/perceuse-test/', 7);
  assert.equal(product.name, 'Perceuse & visseuse');
  assert.equal(product.price, 1234.5);
  assert.equal(product.stock, 7);
  assert.equal(product.stockEstimated, true);
  assert.equal(product.sourceCategorySlug, 'outillage-electroportatif');
  assert.equal(product.description, 'Description complète.\nBloc imbriqué.');
  assert.equal(product.shortDescription, 'Courte description.');
  assert.equal(product.images.includes('https://ingco.tn/uploads/perceuse-large.png'), true);
  assert.equal(product.rating, 4.7);
  assert.equal(product.reviews, 12);
  assert.deepEqual(validateProduct(product), []);
});

test('détecte une rupture de stock et sécurise les entités invalides', () => {
  const outOfStock = productHtml.replace('schema.org/InStock', 'schema.org/OutOfStock');
  const product = parseProduct(outOfStock, 'https://ingco.tn/produit/perceuse-test/');
  assert.equal(product.stock, 0);
  assert.equal(product.availability, 'out_of_stock');
  assert.equal(decodeEntities('A &#x110000; B'), 'A &#x110000; B');
  assert.equal(stripTags('<p>A&nbsp;<strong>B</strong></p>'), 'A B');
});
