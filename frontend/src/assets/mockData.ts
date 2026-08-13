export const heroProducts = 'https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&w=1200&q=80';
export const categories = [
  {id:'outils-electriques-sans-fil', name:'Outils électriques & sans fil', count:0, image:'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=900&q=80'},
  {id:'perceuses', name:'Perceuses', parent:'outils-electriques-sans-fil', count:0},
  {id:'visseuses', name:'Visseuses', parent:'outils-electriques-sans-fil', count:0},
  {id:'meuleuses', name:'Meuleuses', parent:'outils-electriques-sans-fil', count:0},
  {id:'souffleurs', name:'Souffleurs', parent:'outils-electriques-sans-fil', count:0},
  {id:'outils-sans-fil', name:'Outils sans fil', parent:'outils-electriques-sans-fil', count:0},
  {id:'batteries-chargeurs', name:'Batteries et chargeurs', parent:'outils-electriques-sans-fil', count:0},

  {id:'outillage-a-main', name:'Outillage à main', count:0, image:'https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?auto=format&fit=crop&w=900&q=80'},
  {id:'marteaux', name:'Marteaux', parent:'outillage-a-main', count:0},
  {id:'cles', name:'Clés', parent:'outillage-a-main', count:0},
  {id:'pinces', name:'Pinces', parent:'outillage-a-main', count:0},
  {id:'tournevis', name:'Tournevis', parent:'outillage-a-main', count:0},
  {id:'outils-de-mesure', name:'Outils de mesure', parent:'outillage-a-main', count:0},

  {id:'accessoires-consommables', name:'Accessoires & consommables', count:0, image:'https://images.unsplash.com/photo-1530124566582-a618bc2615dc?auto=format&fit=crop&w=900&q=80'},
  {id:'meches-forets', name:'Mèches et forets', parent:'accessoires-consommables', count:0},
  {id:'meules-disques', name:'Meules et disques', parent:'accessoires-consommables', count:0},
  {id:'accessoires', name:'Accessoires', parent:'accessoires-consommables', count:0},

  {id:'atelier-soudure-pneumatique', name:'Atelier, soudure & pneumatique', count:0, image:'https://images.unsplash.com/photo-1581783898377-1c85bf937427?auto=format&fit=crop&w=900&q=80'},
  {id:'soudure', name:'Soudure', parent:'atelier-soudure-pneumatique', count:0},
  {id:'pneumatique', name:'Pneumatique', parent:'atelier-soudure-pneumatique', count:0},
  {id:'caisses-a-outils', name:'Caisses à outils', parent:'atelier-soudure-pneumatique', count:0},
  {id:'outils-de-bricolage', name:'Outils de bricolage', parent:'atelier-soudure-pneumatique', count:0},

  {id:'plomberie-pompage', name:'Plomberie & pompage', count:0, image:'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&w=900&q=80'},
  {id:'plomberie', name:'Plomberie', parent:'plomberie-pompage', count:0},
  {id:'pompes-a-eau', name:'Pompes à eau', parent:'plomberie-pompage', count:0},

  {id:'menuiserie-peinture', name:'Menuiserie & peinture', count:0, image:'https://images.unsplash.com/photo-1601058268499-e52658b8bb88?auto=format&fit=crop&w=900&q=80'},
  {id:'menuiserie', name:'Menuiserie', parent:'menuiserie-peinture', count:0},
  {id:'peinture', name:'Peinture', parent:'menuiserie-peinture', count:0},

  {id:'jardin-agriculture', name:'Jardin & agriculture', count:0, image:'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=900&q=80'},
  {id:'outils-agricoles', name:'Outils agricoles', parent:'jardin-agriculture', count:0},

  {id:'packs-rangement', name:'Packs & rangement', count:0, image:'https://images.unsplash.com/photo-1540103711724-ebf833bde8d1?auto=format&fit=crop&w=900&q=80'},
  {id:'packs', name:'Packs', parent:'packs-rangement', count:0},
  {id:'rangement-transport', name:'Rangement et transport', parent:'packs-rangement', count:0}
];
export const products = [
 {_id:'p1', name:'MacBook Air M2 13 pouces', slug:'macbook-air-m2', price:2899, oldPrice:3399, category:'electronics', rating:4.8, reviews:12, stock:8, badge:'-15%', image:'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=700&q=80', images:['https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=900&q=80'], demoVideo:'https://www.youtube.com/watch?v=dQw4w9WgXcQ', demoVideoType:'youtube', demoVideoTitle:'Présentation vidéo MacBook Air'},
 {_id:'p2', name:'iPhone 15 Pro 256 Go', slug:'iphone-15-pro', price:3299, oldPrice:0, category:'electronics', rating:4.9, reviews:18, stock:14, badge:'Nouveau', image:'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=700&q=80'},
 {_id:'p3', name:'Sony WH-1000XM5', slug:'sony-wh-1000xm5', price:899, oldPrice:1129, category:'electronics', rating:4.7, reviews:24, stock:6, badge:'-20%', image:'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?auto=format&fit=crop&w=700&q=80'},
 {_id:'p4', name:'Samsung Galaxy Watch 6', slug:'galaxy-watch-6', price:799, oldPrice:0, category:'electronics', rating:4.6, reviews:7, stock:11, badge:'Nouveau', image:'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=700&q=80'},
 {_id:'p5', name:'iPad Air 5ème génération', slug:'ipad-air', price:1799, oldPrice:1999, category:'electronics', rating:4.5, reviews:9, stock:5, badge:'-10%', image:'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=700&q=80'},
 {_id:'p6', name:'Écran Dell 24 Full HD', slug:'ecran-dell-24', price:499, oldPrice:0, category:'electronics', rating:4.9, reviews:11, stock:10, image:'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=700&q=80'},
 {_id:'p7', name:'Canon EOS 250D + 18-55mm', slug:'canon-eos-250d', price:1699, oldPrice:0, category:'electronics', rating:4.6, reviews:6, stock:2, image:'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=700&q=80'},
 {_id:'p8', name:'JBL Charge 5', slug:'jbl-charge-5', price:599, oldPrice:0, category:'electronics', rating:4.8, reviews:13, stock:18, badge:'Nouveau', image:'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=700&q=80'},
 {_id:'watch', name:'Montre Classique Élégante', slug:'montre-classique', price:150, oldPrice:199, category:'fashion', rating:4.6, reviews:128, stock:25, badge:'-25%', image:'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?auto=format&fit=crop&w=900&q=80', images:['https://images.unsplash.com/photo-1523170335258-f5ed11844a49?auto=format&fit=crop&w=1000&q=80','https://images.unsplash.com/photo-1434056886845-dac89ffe9b56?auto=format&fit=crop&w=900&q=80','https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?auto=format&fit=crop&w=900&q=80'], demoVideo:'https://www.youtube.com/watch?v=dQw4w9WgXcQ', demoVideoType:'youtube', demoVideoTitle:'Démonstration de la montre'},
 {_id:'perfume', name:'Parfum Femme - Élégance', slug:'parfum-femme', price:99, oldPrice:0, category:'beauty', rating:4.4, reviews:8, stock:9, image:'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=700&q=80'}
];
