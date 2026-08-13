import { Heart, Trash2 } from 'lucide-react';
import ProductCard from '../../components/ProductCard.tsx';
import Breadcrumb from '../../components/Breadcrumb.tsx';
import { useFavoriteStore } from '../../store/favoriteStore.ts';

export default function Favorites() {
  const items = useFavoriteStore((state) => state.items);
  const clear = useFavoriteStore((state) => state.clear);
  return <><Breadcrumb items={[{ label: 'Favoris' }]} /><section className="section-head"><div><h1>Mes favoris</h1><p>Produits enregistrés depuis les données chargées par l’API.</p></div>{items.length ? <button className="outline" onClick={clear}><Trash2/> Vider les favoris</button> : null}</section>{items.length ? <div className="products-grid">{items.map((product) => <ProductCard product={product} key={product._id || product.id}/>)}</div> : <div className="empty-products"><Heart size={56}/><h3>Aucun favori</h3><p>Cliquez sur le cœur d’un produit pour l’ajouter ici.</p></div>}</>;
}
