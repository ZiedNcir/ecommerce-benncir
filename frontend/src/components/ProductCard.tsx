import { Heart, PlayCircle, ShoppingCart, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCartStore } from '../store/cartStore.ts';
import { useFavoriteStore } from '../store/favoriteStore.ts';

const getImage = (product) => product?.image || product?.images?.[0] || 'https://placehold.co/700x520?text=Product';
const getId = (product) => product?._id || product?.id;

export default function ProductCard({ product }) {
  const add = useCartStore((state) => state.add);
  const toggleFavorite = useFavoriteStore((state) => state.toggle);
  const isFavorite = useFavoriteStore((state) => state.has(getId(product)));
  const id = getId(product);
  const discount = product?.oldPrice > product?.price ? `-${Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)}%` : product?.badge;
  const categoryName = typeof product?.category === 'object' ? product.category?.name : product?.categoryName;

  return (
    <article className="product-card">
      {discount ? <span className={String(discount).includes('-') ? 'badge sale' : 'badge new'}>{discount}</span> : null}
      <button className={`wish ${isFavorite ? 'active' : ''}`} onClick={() => toggleFavorite(product)} aria-label="Ajouter aux favoris"><Heart size={21} fill={isFavorite ? 'currentColor' : 'none'} /></button>
      <Link to={`/product/${id}`} className="product-img"><img src={getImage(product)} alt={product.name} />{product.demoVideo ? <span className="video-chip"><PlayCircle size={15} /> Vidéo</span> : null}</Link>
      <div className="product-info">
        {categoryName ? <small className="product-category-label">{categoryName}</small> : null}
        <Link to={`/product/${id}`}><h3>{product.name}</h3></Link>
        <p className="stars" aria-label={`${product.rating || 5} étoiles`}>
          {[1, 2, 3, 4, 5].map((item) => <Star key={item} size={14} fill="currentColor" />)}
          <span>({product.reviews || 0})</span>
        </p>
        <div className="price"><b>{Number(product.price || 0).toLocaleString('fr-FR')},00 TND</b>{product.oldPrice ? <del>{Number(product.oldPrice).toLocaleString('fr-FR')},00 TND</del> : null}</div>
        <div className={product.stock > 2 ? 'stock' : 'stock limited'}>{product.stock > 2 ? 'En stock' : 'Stock limité'}</div>
        <button onClick={() => add(product)} className="cart-mini" aria-label="Ajouter au panier"><ShoppingCart size={18} /></button>
      </div>
    </article>
  );
}
