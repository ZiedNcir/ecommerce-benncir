import { useEffect, useRef, useState } from 'react';
import { Check, ShoppingBag, X } from 'lucide-react';
import { Link } from 'react-router-dom';

type CartToastDetail = { name?: string; qty?: number; image?: string };

export default function CartToast() {
  const [item, setItem] = useState<CartToastDetail | null>(null);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    const show = (event: Event) => {
      setItem((event as CustomEvent<CartToastDetail>).detail || {});
      if (timer.current) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setItem(null), 3500);
    };
    window.addEventListener('cart:item-added', show);
    return () => {
      window.removeEventListener('cart:item-added', show);
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, []);

  if (!item) return null;
  return <aside className="cart-toast" role="status" aria-live="polite">
    <div className="cart-toast-icon"><Check size={18} /></div>
    {item.image ? <img src={item.image} alt="" /> : null}
    <div className="cart-toast-copy"><strong>Ajouté au panier</strong><span>{item.qty || 1} × {item.name || 'Produit'}</span><Link to="/cart" onClick={() => setItem(null)}><ShoppingBag size={15} /> Voir le panier</Link></div>
    <button type="button" onClick={() => setItem(null)} aria-label="Fermer la notification"><X size={17} /></button><i aria-hidden="true" />
  </aside>;
}
