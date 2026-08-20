import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Headphones,
  HeartHandshake,
  Mail,
  PackageCheck,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  Truck,
} from 'lucide-react';
import ProductCard from '../../components/ProductCard.tsx';
import { categoriesApi, productsApi } from '../../services/api.ts';

const mainHero = {
  eyebrow: 'Bienvenue chez BÊN NCÎR Commerce',
  title: 'Une boutique pour tous vos besoins.',
  description: 'Découvrez une plateforme de vente en ligne simple, rapide et sécurisée, avec des produits pour la maison, la mode, la beauté, l’électronique et bien plus encore.',
  image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=1800&q=88',
  primary: 'Découvrir nos produits',
  secondary: 'En savoir plus',
  primaryLink: '/products',
  secondaryLink: '/about',
} as const;

const categoryFallbacks = [
  { _id: 'electronics', name: 'Électronique', slug: 'electronique', image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&w=700&q=80' },
  { _id: 'fashion', name: 'Mode & accessoires', slug: 'mode-accessoires', image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=700&q=80' },
  { _id: 'home', name: 'Maison & cuisine', slug: 'maison-cuisine', image: 'https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=700&q=80' },
  { _id: 'beauty', name: 'Beauté & santé', slug: 'beaute-sante', image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=700&q=80' },
  { _id: 'sport', name: 'Sport & loisirs', slug: 'sport-loisirs', image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=700&q=80' },
  { _id: 'auto', name: 'Auto & bricolage', slug: 'auto-bricolage', image: 'https://images.unsplash.com/photo-1530124566582-a618bc2615dc?auto=format&fit=crop&w=700&q=80' },
];

const blogItems = [
  { tag: 'Maison', title: '10 idées simples pour mieux organiser votre intérieur', image: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=800&q=82' },
  { tag: 'Technologie', title: 'Comment choisir les bons accessoires pour votre quotidien ?', image: 'https://images.unsplash.com/photo-1523206489230-c012c64b2b48?auto=format&fit=crop&w=800&q=82' },
  { tag: 'Shopping', title: 'Nos conseils pour acheter en ligne en toute sérénité', image: 'https://images.unsplash.com/photo-1556742044-3c52d6e88c62?auto=format&fit=crop&w=800&q=82' },
];

function ScrollPager({ children, count, label }) {
  const railRef = useRef(null);
  const [active, setActive] = useState(0);

  function updatePosition() {
    const rail = railRef.current;
    const firstItem = rail?.firstElementChild;
    if (!rail || !firstItem) return;
    const step = firstItem.getBoundingClientRect().width + 12;
    setActive(Math.min(count - 1, Math.round(rail.scrollLeft / step)));
  }

  function move(direction) {
    const rail = railRef.current;
    if (!rail) return;
    rail.scrollBy({ left: direction * rail.clientWidth * 0.82, behavior: 'smooth' });
  }

  return (
    <div className="mobile-scroll-pager">
      <div className="mobile-scroll-track" ref={railRef} onScroll={updatePosition}>{children}</div>
      <div className="mobile-scroll-controls" aria-label={label}>
        <button type="button" onClick={() => move(-1)} disabled={active === 0} aria-label="Éléments précédents"><ChevronLeft size={15} /></button>
        <div>{Array.from({ length: count }, (_, index) => <i className={index === active ? 'active' : ''} key={index} />)}</div>
        <button type="button" onClick={() => move(1)} disabled={active >= count - 1} aria-label="Éléments suivants"><ChevronRight size={15} /></button>
      </div>
    </div>
  );
}

export default function Home() {
  const [roots, setRoots] = useState([]);
  const [popular, setPopular] = useState([]);
  const [newProducts, setNewProducts] = useState([]);
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    Promise.all([
      categoriesApi.tree(),
      productsApi.list({ featured: true, limit: 8 }),
      productsApi.list({ sort: 'newest', limit: 8 }),
    ]).then(([categoryTree, featuredProducts, newestProducts]) => {
      setRoots(Array.isArray(categoryTree) ? categoryTree : []);
      setPopular(Array.isArray(featuredProducts) ? featuredProducts : featuredProducts?.items || []);
      setNewProducts(Array.isArray(newestProducts) ? newestProducts : newestProducts?.items || []);
    }).catch(() => { });
  }, []);

  const categories = useMemo(() => {
    const normalized = roots.filter((item) => item?.name).map((item, index) => ({
      ...item,
      image: item.image || categoryFallbacks[index % categoryFallbacks.length].image,
    }));
    return normalized.length ? normalized.slice(0, 6) : categoryFallbacks;
  }, [roots]);

  const brands = useMemo(() => {
    const fromProducts = [...new Set([...popular, ...newProducts].map((item) => item.brand).filter(Boolean))];
    return (fromProducts.length ? fromProducts : ['Samsung', 'Xiaomi', 'Bosch', 'Sony', 'Nike', 'DeLonghi']).slice(0, 8);
  }, [popular, newProducts]);

  const handleNewsletter = (event) => {
    event.preventDefault();
    if (!email.trim()) return;
    setSubscribed(true);
    setEmail('');
  };

  return (
    <div className="commerce-home">
      <section className="commerce-hero">
        <div className="commerce-hero-media" style={{ backgroundImage: `url(${mainHero.image})` }} />
        <div className="commerce-hero-shade" />
        <div className="commerce-hero-content">
          <span className="commerce-eyebrow"><Sparkles size={17} /> {mainHero.eyebrow}</span>
          <h1>{mainHero.title}</h1>
          <p>{mainHero.description}</p>
          <div className="commerce-hero-actions">
            <Link className="commerce-btn commerce-btn-gold" to={mainHero.primaryLink}>{mainHero.primary}<ArrowRight size={18} /></Link>
            <Link className="commerce-btn commerce-btn-light" to={mainHero.secondaryLink}>{mainHero.secondary}</Link>
          </div>
        </div>
      </section>

      <section className="commerce-benefits">
        <article><Truck /><div><strong>Livraison rapide</strong><span>Partout en Tunisie</span></div></article>
        <article><CreditCard /><div><strong>Paiement sécurisé</strong><span>Commande protégée</span></div></article>
        <article><PackageCheck /><div><strong>Produits sélectionnés</strong><span>Qualité contrôlée</span></div></article>
        <article><Headphones /><div><strong>Service client</strong><span>Une équipe à votre écoute</span></div></article>
      </section>

      <section className="commerce-section commerce-categories">
        <div className="commerce-section-title"><div><span>Explorer</span><h2>Nos catégories</h2></div><Link to="/categories">Voir tout <ArrowRight size={16} /></Link></div>
        <ScrollPager count={categories.length + 1} label="Navigation des catégories">
        <div className="commerce-category-grid">
          {categories.map((category) => <Link to={`/products?category=${category.slug || category._id}`} className="commerce-category-card" key={category._id || category.slug}>
            <div><img src={category.image} alt={category.name} /></div>
            <strong>{category.name}</strong>
            <span>Découvrir <ChevronRight size={14} /></span>
          </Link>)}
          <Link to="/categories" className="commerce-category-card commerce-category-more"><div><ShoppingBag /></div><strong>Toutes les catégories</strong><span>Voir le catalogue <ChevronRight size={14} /></span></Link>
        </div>
        </ScrollPager>
      </section>

      <section className="commerce-section">
        <div className="commerce-section-title"><div><span>Les favoris du moment</span><h2>Produits populaires</h2></div><Link to="/products">Voir tous les produits <ArrowRight size={16} /></Link></div>
        <ScrollPager count={Math.max(1, popular.slice(0, 5).length)} label="Navigation des produits populaires">
          <div className="products-grid commerce-product-grid">{popular.slice(0, 5).map((product) => <ProductCard product={product} key={product._id} />)}</div>
        </ScrollPager>
      </section>

 

      <section className="commerce-section">
        <div className="commerce-section-title"><div><span>Tout juste arrivés</span><h2>Nos nouveautés</h2></div><Link to="/products?sort=newest">Voir les nouveautés <ArrowRight size={16} /></Link></div>
        <ScrollPager count={Math.max(1, newProducts.slice(0, 5).length)} label="Navigation des nouveautés">
          <div className="products-grid commerce-product-grid">{newProducts.slice(0, 5).map((product) => <ProductCard product={product} key={product._id} />)}</div>
        </ScrollPager>
      </section>

      <section className="commerce-brand-section">
        <div className="commerce-section-title"><div><span>Une offre ouverte</span><h2>Nos marques</h2></div><Link to="/products">Découvrir les marques <ArrowRight size={16} /></Link></div>
        <div className="commerce-brand-row">{brands.map((brand) => <div key={brand}>{brand}</div>)}</div>
      </section>

      <section className="commerce-story-grid">
        <div className="commerce-values">
          <span className="commerce-eyebrow dark"><HeartHandshake size={17} /> Notre engagement</span>
          <h2>Une expérience d’achat simple, humaine et rassurante.</h2>
          <p>BÊN NCÎR Commerce n’est pas limité à une seule marque ou à un seul univers. Notre catalogue évolue pour répondre aux besoins du quotidien.</p>
          <div className="commerce-value-list">
            <span><ShieldCheck /> Commandes sécurisées</span>
            <span><PackageCheck /> Produits clairement présentés</span>
            <span><Headphones /> Accompagnement client</span>
          </div>
          <Link className="commerce-btn commerce-btn-dark" to="/about">En savoir plus <ArrowRight size={17} /></Link>
        </div>
        <div className="commerce-review-panel">
          <div className="commerce-review-stars">{[1, 2, 3, 4, 5].map((item) => <Star key={item} fill="currentColor" />)}</div>
          <blockquote>« Une boutique claire et agréable. J’ai trouvé rapidement ce que je cherchais et la commande était très simple. »</blockquote>
          <strong>Expérience client BÊN NCÎR Commerce</strong>
          <span>Qualité · Confiance · Satisfaction</span>
        </div>
      </section>

     
      <footer className="commerce-footer">
        <div className="commerce-footer-main">
          <div className="commerce-footer-brand"><strong>BÊN NCÎR</strong><span>COMMERCE</span><p>Votre destination shopping en ligne. Une sélection multi-catégories, un service fiable et une expérience simple.</p></div>
          <div><h3>Catalogue</h3><Link to="/categories">Toutes les catégories</Link><Link to="/products">Tous les produits</Link><Link to="/products?sort=newest">Nouveautés</Link></div>
          <div><h3>Informations</h3><Link to="/about">À propos</Link><Link to="/contact">Contact</Link><Link to="/favorites">Favoris</Link></div>
          <div><h3>Contact</h3><span>+216 24 037 404</span><span>benncircommerce@gmail.com</span><span>Tunisie</span></div>
        </div>
        <div className="commerce-footer-bottom"><span>© {new Date().getFullYear()} BÊN NCÎR Commerce. Tous droits réservés.</span><span>Qualité · Confiance · Satisfaction</span></div>
      </footer>
    </div>
  );
}
