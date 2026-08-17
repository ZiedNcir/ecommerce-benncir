import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Heart, Minus, Plus, ShoppingCart, Star, Truck, ShieldCheck, RefreshCcw, Headphones, X, ZoomIn } from 'lucide-react';
import Breadcrumb from '../../components/Breadcrumb.tsx';
import ProductCard from '../../components/ProductCard.tsx';
import Loading from '../../components/Loading.tsx';
import { productsApi } from '../../services/api.ts';
import { useCartStore } from '../../store/cartStore.ts';
import { useFavoriteStore } from '../../store/favoriteStore.ts';

const serviceBenefits = [
  { Icon: Truck, title: 'Livraison rapide', text: 'Partout en Tunisie' },
  { Icon: ShieldCheck, title: 'Paiement sécurisé', text: '100% sécurisé' },
  { Icon: RefreshCcw, title: 'Satisfait ou remboursé', text: '30 jours pour retourner' },
  { Icon: Headphones, title: 'Support 24/7', text: 'Nous sommes là pour vous' },
];

function getVideoEmbed(product) {
  const url = product?.demoVideo?.trim();
  if (!url) return null;
  const type = product.demoVideoType || 'url';
  if (type === 'youtube' || url.includes('youtube.com') || url.includes('youtu.be')) {
    const match = url.match(/(?:v=|youtu\.be\/|embed\/)([A-Za-z0-9_-]{6,})/);
    const id = match?.[1];
    return id ? { kind: 'iframe', src: `https://www.youtube.com/embed/${id}` } : { kind: 'link', src: url };
  }
  if (type === 'vimeo' || url.includes('vimeo.com')) {
    const match = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    const id = match?.[1];
    return id ? { kind: 'iframe', src: `https://player.vimeo.com/video/${id}` } : { kind: 'link', src: url };
  }
  if (/\.(mp4|webm|ogg)(\?|$)/i.test(url) || type === 'upload') return { kind: 'video', src: url };
  return { kind: 'link', src: url };
}

export default function ProductDetails() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [qty, setQty] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [zoom, setZoom] = useState({ active: false, x: 50, y: 50 });
  const [lightbox, setLightbox] = useState(false);
  const [cartNotice, setCartNotice] = useState('');
  const add = useCartStore((state) => state.add);
  const toggleFavorite = useFavoriteStore((state) => state.toggle);

  useEffect(() => {
    let alive = true;
    productsApi.one(id).then((data) => { if (alive) { setProduct(data); const category = data.category?.slug || data.category?._id || data.category; productsApi.list({ category }).then((items) => setRelated(items.filter((item) => item._id !== data._id).slice(0, 4))).catch(() => setRelated([])); } }).catch(() => setProduct(null));
    return () => { alive = false; };
  }, [id]);

  useEffect(() => {
    setActiveImage(0);
    setZoom({ active: false, x: 50, y: 50 });
    setLightbox(false);
  }, [id]);

  useEffect(() => {
    if (!lightbox) return undefined;
    const close = (event) => { if (event.key === 'Escape') setLightbox(false); };
    document.addEventListener('keydown', close);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', close); document.body.style.overflow = ''; };
  }, [lightbox]);

  if (!product) return <Loading />;
  const imgs = product.images?.length ? product.images : [product.image].filter(Boolean);
  const discount = product.oldPrice > product.price ? `-${Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)}%` : product.badge;
  const video = getVideoEmbed(product);

  const maxQuantity = Math.max(0, Number(product.stock || 0));
  function addToCart() {
    if (!maxQuantity) return;
    add(product, Math.min(qty, maxQuantity));
  }

  return (
    <>
      <Breadcrumb items={[{ label: product.category?.name || 'Produit' }, { label: product.name }]} />
      <section className="details"><div className="thumbs">{imgs.slice(0, 5).map((image, index) => <button type="button" className={activeImage === index ? 'active' : ''} key={index} onClick={() => { setActiveImage(index); setZoom({ active: false, x: 50, y: 50 }); }} aria-label={`Afficher l’image ${index + 1}`}><img src={image} alt={`${product.name} ${index + 1}`} /></button>)}</div><div className={`main-photo ingco-product-zoom ${zoom.active ? 'is-zoomed' : ''}`} onMouseEnter={() => setZoom((state) => ({ ...state, active: true }))} onMouseLeave={() => setZoom((state) => ({ ...state, active: false }))} onMouseMove={(event) => { const rect = event.currentTarget.getBoundingClientRect(); setZoom({ active: true, x: Math.max(0, Math.min(100, ((event.clientX - rect.left) / rect.width) * 100)), y: Math.max(0, Math.min(100, ((event.clientY - rect.top) / rect.height) * 100)) }); }} onClick={() => setLightbox(true)} role="button" tabIndex={0} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') setLightbox(true); }} aria-label="Agrandir l’image du produit">{discount ? <span className="badge sale">{discount}</span> : null}<img src={imgs[activeImage] || imgs[0]} alt={product.name} style={{ transformOrigin: `${zoom.x}% ${zoom.y}%` }} /><span className="zoom-hint"><ZoomIn size={17}/> Cliquez pour agrandir</span></div><div className="detail-info"><h1>{product.name}</h1><p className="stars"><Star fill="currentColor"/><Star fill="currentColor"/><Star fill="currentColor"/><Star fill="currentColor"/><Star/> <span>{product.rating || 0} ({product.reviews || 0} avis)</span></p><div className="big-price">{Number(product.price).toLocaleString('fr-FR')},00 TND {product.oldPrice ? <del>{Number(product.oldPrice).toLocaleString('fr-FR')},00 TND</del> : null}</div><p>{product.shortDescription || product.description}</p><p className="stock">● {product.stock > 0 ? `En stock (${product.stock} disponible${Number(product.stock) > 1 ? 's' : ''})` : 'Rupture de stock'} <span>Livraison disponible</span></p>{product.colors?.length ? <><b>Couleur : {product.colors[0]}</b><div className="colors">{product.colors.map((color) => <i key={color} title={color}/>)}</div></> : null}<div className="qty">Quantité : <button type="button" onClick={() => setQty(Math.max(1, qty - 1))} disabled={qty <= 1}><Minus/></button><b>{qty}</b><button type="button" onClick={() => setQty(Math.min(maxQuantity || 1, qty + 1))} disabled={!maxQuantity || qty >= maxQuantity}><Plus/></button></div><div className="detail-actions"><button className="btn" disabled={!maxQuantity} onClick={addToCart}><ShoppingCart/> {maxQuantity ? 'Ajouter au panier' : 'Indisponible'}</button><button onClick={() => toggleFavorite(product)}><Heart/> Ajouter aux favoris</button></div>{cartNotice ? <p className="success-msg">{cartNotice}</p> : null}<p className="green-strip">Garantie | Retour facile | Produit authentique</p></div><aside className="side-info">{serviceBenefits.map(({ Icon, title, text }) => <div key={title}><Icon/><span><b>{title}</b><small>{text}</small></span></div>)}<hr/><h3>Informations supplémentaires</h3><p>Marque <b>{product.brand || '—'}</b></p><p>Référence <b>{product.sku || '—'}</b></p><p>Catégorie <b>{product.category?.name || '—'}</b></p><p>Stock <b>{product.stock}</b></p></aside></section>
      <section className="tabs"><b>Description</b><span>Caractéristiques</span><span>Avis ({product.reviews || 0})</span><span>Vidéo</span><span>Livraison & Retours</span></section><div className="description-box"><p>{product.description}</p>{product.features?.length ? <ul>{product.features.map((feature) => <li key={feature}>{feature}</li>)}</ul> : null}{product.specifications?.length ? <div className="product-specifications"><h3>Caractéristiques techniques</h3><div>{product.specifications.map((spec, index) => <p key={`${spec.key}-${index}`}><span>{spec.key}</span><strong>{spec.value}</strong></p>)}</div></div> : null}{product.tags?.length ? <div className="product-tags">{product.tags.map((tag) => <span key={tag}>{tag}</span>)}</div> : null}</div>
      {video ? (
        <section className="product-video-section">
          <div className="section-head"><h2>{product.demoVideoTitle || 'Vidéo démonstrative'}</h2><span>Présentation produit</span></div>
          <div className="product-video-card">
            {video.kind === 'iframe' ? <iframe src={video.src} title={product.demoVideoTitle || product.name} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen /> : null}
            {video.kind === 'video' ? <video src={video.src} controls preload="metadata" /> : null}
            {video.kind === 'link' ? <a href={video.src} target="_blank" rel="noreferrer" className="btn">Voir la vidéo démonstrative</a> : null}
          </div>
        </section>
      ) : null}
      {related.length ? <><section className="section-head"><h2>Vous pourriez aussi aimer</h2><a>Voir tout</a></section><div className="products-grid small">{related.map((item) => <ProductCard product={item} key={item._id}/>)}</div></> : null}
      {lightbox ? <div className="product-lightbox" role="dialog" aria-modal="true" aria-label="Image agrandie" onClick={() => setLightbox(false)}><button type="button" className="product-lightbox-close" onClick={() => setLightbox(false)} aria-label="Fermer"><X/></button><img src={imgs[activeImage] || imgs[0]} alt={product.name} onClick={(event) => event.stopPropagation()} /></div> : null}
    </>
  );
}
