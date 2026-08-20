import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Lock, Minus, Plus, Trash2 } from 'lucide-react';
import Breadcrumb from '../../components/Breadcrumb.tsx';
import BenefitBar from '../../components/BenefitBar.tsx';
import ProductCard from '../../components/ProductCard.tsx';
import { productsApi } from '../../services/api.ts';
import { useCartStore } from '../../store/cartStore.ts';

export default function Cart() {
  const { items, inc, dec, remove, clear, subtotal } = useCartStore();
  const [suggestions, setSuggestions] = useState([]);
  useEffect(() => { productsApi.list({ featured: true }).then((data) => setSuggestions(data.slice(0, 4))).catch(() => setSuggestions([])); }, []);
  const sub = subtotal();
  const delivery = items.length ? 8 : 0;
  const total = sub + delivery;
  return <><Breadcrumb items={[{ label: 'Panier' }]} /><h1>Mon panier <span className="gold">({items.length} articles)</span></h1><p>Vérifiez vos articles, modifiez les quantités ou passez à la caisse.</p><div className="cart-layout"><section className="cart-table"><div className="cart-head"><b>Produit</b><b>Prix unitaire</b><b>Quantité</b><b>Total</b></div>{items.map((item) => <div className="cart-line" key={item._id || item.id}><div><img src={item.image || item.images?.[0]} alt={item.name} /><span><b>{item.name}</b><small>{item.category?.name || item.sku || ''}</small><em>● {item.stock > 0 ? 'En stock' : 'Stock limité'}</em></span></div><b>{Number(item.price).toLocaleString('fr-FR')},00 TND</b><div className="qty"><button onClick={() => dec(item._id || item.id)}><Minus /></button><b>{item.qty}</b><button onClick={() => inc(item._id || item.id)}><Plus /></button><a onClick={() => remove(item._id || item.id)}><Trash2 /> Supprimer</a></div><b>{Number(item.price * item.qty).toLocaleString('fr-FR')},00 TND</b></div>)}{items.length === 0 ? <div className="empty-products"><h3>Votre panier est vide</h3><p>Ajoutez des produits depuis la boutique.</p></div> : null}<div className="cart-actions"><Link className="outline" to="/products"><ArrowLeft /> Continuer mes achats</Link><button onClick={clear}><Trash2 /> Vider le panier</button></div></section><aside className="summary"><div className="secure"><Lock />Paiement 100% sécurisé<br /><small>Vos données sont protégées.</small></div><h2>Récapitulatif de la commande</h2><p>Sous-total ({items.length} articles)<b>{Number(sub).toLocaleString('fr-FR')},00 TND</b></p><p>Livraison<b>{Number(delivery).toLocaleString('fr-FR')},00 TND</b></p><hr /><h2>Total <b>{Number(total).toLocaleString('fr-FR')},00 TND</b></h2><Link className="btn wide" to="/checkout"><Lock /> Passer à la caisse</Link>
   
  </aside></div><BenefitBar />{suggestions.length ? <><h2>Vous aimerez peut-être aussi</h2><div className="products-grid small">{suggestions.map((product) => <ProductCard product={product} key={product._id} />)}</div></> : null}</>;
}
