import { useEffect, useMemo, useState } from 'react';
import { Link, NavLink, useNavigate, useSearchParams } from 'react-router-dom';
import { Heart, Search, ShoppingCart, Mail, Phone, Truck, ChevronDown } from 'lucide-react';
import Logo from './Logo.tsx';
import { useCartStore } from '../store/cartStore.ts';
import { useFavoriteStore } from '../store/favoriteStore.ts';
import { categoriesApi, productsApi } from '../services/api.ts';

export default function Header() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const count = useCartStore((state) => state.count());
  const favoriteCount = useFavoriteStore((state) => state.count());
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [category, setCategory] = useState(searchParams.get('category') || 'all');
  const [categories, setCategories] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);

  useEffect(() => { categoriesApi.list().then(setCategories).catch(() => setCategories([])); }, []);
  useEffect(() => { setSearch(searchParams.get('search') || ''); setCategory(searchParams.get('category') || 'all'); }, [searchParams]);

  const categoryOptions = useMemo(() => [{ _id: 'all', slug: 'all', name: 'Toutes catégories' }, ...categories], [categories]);
  const matchingCategories = useMemo(() => {
    const value = search.trim().toLowerCase();
    if (value.length < 2) return [];
    return categories.filter((item) => item.name?.toLowerCase().includes(value)).slice(0, 4);
  }, [categories, search]);

  useEffect(() => {
    const cleanSearch = search.trim();
    if (cleanSearch.length < 2) {
      setSuggestions([]);
      return undefined;
    }
    const timer = window.setTimeout(() => {
      productsApi.list({ search: cleanSearch, ...(category !== 'all' ? { category } : {}), limit: 5 })
        .then((data) => setSuggestions((Array.isArray(data) ? data : data.items || []).slice(0, 5)))
        .catch(() => setSuggestions([]));
    }, 250);
    return () => window.clearTimeout(timer);
  }, [search, category]);

  const submitSearch = (event) => {
    event.preventDefault();
    const params = new URLSearchParams();
    const cleanSearch = search.trim();
    if (cleanSearch) params.set('search', cleanSearch);
    if (category !== 'all') params.set('category', category);
    setSuggestionsOpen(false);
    navigate(`/products${params.toString() ? `?${params.toString()}` : ''}`);
  };

  function chooseProduct(product) {
    setSuggestionsOpen(false);
    navigate(`/product/${product.slug || product._id}`);
  }

  return (
    <header className="site-header">
      <div className="topbar"><div className="top-left"><span><Phone size={16}/> +216 24 037 404</span><span><Mail size={16}/> benncircommerce@gmail.com</span></div><div className="top-shipping"><Truck size={18}/> Livraison partout en Tunisie</div><div className="top-social">Suivez-nous : <i>f</i><i>◎</i><i className="wa">◉</i></div></div>
      <div className="mainbar">
        <Link to="/" className="logo-link"><Logo /></Link>
        <form className="search header-search-autocomplete" onSubmit={submitSearch} role="search">
          <input value={search} onFocus={() => setSuggestionsOpen(true)} onBlur={() => window.setTimeout(() => setSuggestionsOpen(false), 160)} onChange={(event) => { setSearch(event.target.value); setSuggestionsOpen(true); }} autoComplete="off" placeholder="Rechercher un produit, une catégorie..." aria-label="Rechercher un produit" />
          <label className="category-select" aria-label="Filtrer par catégorie"><select value={category} onChange={(event) => setCategory(event.target.value)}>{categoryOptions.map((item) => <option value={item.slug || item._id} key={item._id}>{item.name}</option>)}</select><ChevronDown size={18}/></label>
          <button type="submit" className="search-submit" aria-label="Rechercher"><Search size={28}/></button>
          {suggestionsOpen && search.trim().length >= 2 ? <div className="search-suggestions">
            {matchingCategories.length ? <div className="suggestion-group"><small>Catégories</small>{matchingCategories.map((item) => <button type="button" key={item._id} onMouseDown={() => navigate(`/products?category=${item.slug || item._id}`)}><span className="suggestion-icon"><Search size={15}/></span><b>{item.name}</b><em>Catégorie</em></button>)}</div> : null}
            {suggestions.length ? <div className="suggestion-group"><small>Produits</small>{suggestions.map((product) => <button type="button" key={product._id || product.id} onMouseDown={() => chooseProduct(product)}><img src={product.images?.[0] || product.image} alt="" /><span><b>{product.name}</b><em>{Number(product.price || 0).toFixed(2)} DT</em></span></button>)}</div> : null}
            {!suggestions.length && !matchingCategories.length ? <p>Aucun résultat direct. Appuyez sur Entrée pour rechercher.</p> : null}
          </div> : null}
        </form>
        <div className="head-actions"><Link to="/favorites" className="with-badge"><Heart/><span>Favoris</span>{favoriteCount > 0 && <em>{favoriteCount}</em>}</Link><Link to="/cart" className="with-badge"><ShoppingCart/><span>Panier</span>{count > 0 && <em>{count}</em>}</Link></div>
      </div>
      <nav className="nav"><NavLink to="/">Accueil</NavLink><NavLink to="/products">Boutique</NavLink><NavLink to="/categories">Catégories <ChevronDown size={15}/></NavLink><NavLink to="/about">À propos</NavLink><NavLink to="/contact">Contact</NavLink></nav>
    </header>
  );
}
