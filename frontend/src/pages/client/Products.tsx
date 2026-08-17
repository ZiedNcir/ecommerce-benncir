import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ChevronDown, ChevronLeft, ChevronRight, FolderTree, Grid3X3, List, LoaderCircle, SearchX, SlidersHorizontal, Sparkles, X } from 'lucide-react';
import Breadcrumb from '../../components/Breadcrumb.tsx';
import ProductCard from '../../components/ProductCard.tsx';
import Loading from '../../components/Loading.tsx';
import { productsApi } from '../../services/api.ts';

const normalizeCategory = (value) => (!value || value === 'all' ? '' : value);
const currency = (value) => Number(value || 0).toLocaleString('fr-FR');
const MAX_PRICE = 5000;

function pageItems(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1);
  const visible = new Set([1, total, current, current - 1, current + 1].filter((item) => item > 0 && item <= total));
  const pages = [...visible].sort((a, b) => a - b);
  return pages.reduce((result, item, index) => {
    if (index && item - pages[index - 1] > 1) result.push(`ellipsis-${item}`);
    result.push(item);
    return result;
  }, []);
}

export default function Products() {
  const { categoryId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('search') || '';
  const activeCategory = normalizeCategory(categoryId) || normalizeCategory(searchParams.get('category'));
  const [payload, setPayload] = useState({ items: [], total: 0, page: 1, pages: 1, filters: { categories: [], brands: [], price: { min: 0, max: MAX_PRICE } } });
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [view, setView] = useState(searchParams.get('view') || 'grid');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [openCategories, setOpenCategories] = useState({});
  const appendNextPage = useRef(false);
  const loadingMoreRef = useRef(false);
  const loadMoreSentinel = useRef(null);

  const sort = searchParams.get('sort') || 'popular';
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';
  const inStock = searchParams.get('inStock') === 'true';
  const brand = searchParams.get('brand') || '';
  const page = Number(searchParams.get('page') || 1);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    const append = appendNextPage.current;
    appendNextPage.current = false;
    productsApi.list({
      meta: true,
      limit: 24,
      page,
      ...(query ? { search: query } : {}),
      ...(activeCategory ? { category: activeCategory } : {}),
      ...(minPrice ? { minPrice } : {}),
      ...(maxPrice ? { maxPrice } : {}),
      ...(brand ? { brand } : {}),
      ...(inStock ? { inStock: true } : {}),
      ...(sort ? { sort } : {}),
    })
      .then((data) => {
        if (!alive) return;
        setPayload((current) => ({
          items: append ? [...current.items, ...(data.items || [])] : (data.items || []),
          total: data.total || 0,
          page: data.page || 1,
          pages: data.pages || 1,
          filters: data.filters || { categories: [], brands: [], price: { min: 0, max: MAX_PRICE } },
        }));
      })
      .catch(() => {
        if (alive) setPayload((current) => ({ ...current, items: [], total: 0, pages: 1 }));
      })
      .finally(() => {
        if (alive) setLoading(false);
        if (alive) {
          setLoadingMore(false);
          loadingMoreRef.current = false;
        }
      });
    return () => { alive = false; };
  }, [query, activeCategory, minPrice, maxPrice, brand, inStock, sort, page]);

  useEffect(() => {
    const sentinel = loadMoreSentinel.current;
    if (!sentinel || payload.page >= payload.pages) return undefined;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting || loadingMoreRef.current || loading) return;
      loadingMoreRef.current = true;
      appendNextPage.current = true;
      setLoadingMore(true);
      updateFilter('page', payload.page + 1);
    }, { rootMargin: '280px 0px' });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [payload.page, payload.pages, loading]);

  const categories = payload.filters.categories || [];
  const selectedCategory = useMemo(() => categories.find((category) => category.slug === activeCategory || category._id === activeCategory), [categories, activeCategory]);

  const categoryTree = useMemo(() => {
    const roots = categories.filter((category) => !category.parent);
    return roots.map((root) => ({
      ...root,
      children: categories.filter((category) => String(category.parent?._id || category.parent || '') === String(root._id || root.id)),
    }));
  }, [categories]);

  useEffect(() => {
    if (!selectedCategory?.parent) return;
    const parentId = String(selectedCategory.parent?._id || selectedCategory.parent);
    setOpenCategories((current) => ({ ...current, [parentId]: true }));
  }, [selectedCategory]);

  const updateFilter = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value === undefined || value === null || value === '' || value === false) next.delete(key);
    else next.set(key, String(value));
    if (key !== 'page') {
      next.delete('page');
      appendNextPage.current = false;
    }
    setSearchParams(next);
  };

  const setCategory = (category) => {
    const next = new URLSearchParams(searchParams);
    if (category) next.set('category', category); else next.delete('category');
    next.delete('page');
    setSearchParams(next);
  };

  const setViewMode = (mode) => {
    setView(mode);
    updateFilter('view', mode === 'list' ? 'list' : '');
  };

  const clearFilters = () => {
    appendNextPage.current = false;
    setView('grid');
    setSearchParams({});
  };

  const hasFilters = Boolean(query || activeCategory || minPrice || maxPrice || brand || inStock || sort !== 'popular');
  const priceMax = MAX_PRICE;

  return (
    <>
      <Breadcrumb items={[{ label: 'Catégories', href: '/categories' }, { label: selectedCategory?.name || 'Boutique' }]} />

      <section className="product-market-hero">
        <div>
          <span className="eyebrow"><Sparkles size={16} /> Catalogue dynamique</span>
          <h1>{selectedCategory?.name || (query ? `Recherche : ${query}` : 'Notre catalogue')}</h1>
          <p>Découvrez notre sélection de produits et trouvez facilement ce qui correspond à vos besoins.</p>
          {hasFilters ? <button className="clear-filter-btn" onClick={clearFilters}><X size={16} /> Réinitialiser les filtres</button> : null}
        </div>
        <div className="product-hero-stats">
          <article><b>{payload.total}</b><span>produits trouvés</span></article>
          <article><b>{categories.length}</b><span>catégories</span></article>
          <article><b>{payload.filters.brands?.length || 0}</b><span>marques</span></article>
        </div>
      </section>

      <div className="active-filter-strip premium-filter-strip">
        <div><SlidersHorizontal size={18} /> Catégories</div>
        <button className={!activeCategory ? 'active' : ''} onClick={() => setCategory('')}>Tous</button>
        {categoryTree.map((category) => (
          <button className={activeCategory === category.slug || activeCategory === category._id || category.children.some((child) => activeCategory === child.slug || activeCategory === child._id) ? 'active' : ''} onClick={() => setCategory(category.slug || category._id)} key={category._id}>
            {category.name} <small>{category.count || category.children.reduce((sum, child) => sum + Number(child.count || 0), 0)}</small>
          </button>
        ))}
      </div>

      <div className="shop-layout premium-shop-layout">
        <button type="button" className="mobile-filter-toggle" aria-expanded={mobileFiltersOpen} aria-controls="catalogue-filters" onClick={() => setMobileFiltersOpen((open) => !open)}>
          <SlidersHorizontal size={18} /><span>{mobileFiltersOpen ? 'Masquer les filtres' : 'Afficher les filtres'}</span>{hasFilters ? <b>Actifs</b> : null}<ChevronDown size={18} className={mobileFiltersOpen ? 'open' : ''} />
        </button>
        <aside id="catalogue-filters" className={`filters filters-pro premium-filters ${mobileFiltersOpen ? 'mobile-open' : ''}`}>
          <div className="filter-head"><h3>Filtres</h3><span>{payload.total}</span></div>

          <div className="filter-block category-filter-block">
            <div className="category-filter-title">
              <div><FolderTree size={18} /><h4>Catégories</h4></div>
              <button type="button" className={!activeCategory ? 'active-all' : ''} onClick={() => setCategory('')}>Tout afficher</button>
            </div>

            <div className="category-filter-tree">
              {categoryTree.map((root) => {
                const rootId = String(root._id || root.id);
                const rootActive = activeCategory === root.slug || activeCategory === root._id;
                const childActive = root.children.some((child) => activeCategory === child.slug || activeCategory === child._id);
                const isOpen = openCategories[rootId] ?? (rootActive || childActive);
                const totalCount = Number(root.count || 0) || root.children.reduce((sum, child) => sum + Number(child.count || 0), 0);
                return (
                  <div className={`category-filter-family ${rootActive || childActive ? 'family-active' : ''}`} key={root._id}>
                    <div className="category-filter-root">
                      <button type="button" className="category-expand" onClick={() => setOpenCategories((current) => ({ ...current, [rootId]: !isOpen }))} aria-label={isOpen ? 'Fermer les sous-catégories' : 'Afficher les sous-catégories'}>
                        <ChevronDown size={17} className={isOpen ? 'open' : ''} />
                      </button>
                      <button type="button" className={`category-root-name ${rootActive ? 'active' : ''}`} onClick={() => setCategory(root.slug || root._id)}>
                        <span>{root.name}</span><b>{totalCount}</b>
                      </button>
                    </div>
                    {isOpen && root.children.length ? (
                      <div className="subcategory-filter-list">
                        {root.children.map((child) => {
                          const active = activeCategory === child.slug || activeCategory === child._id;
                          return (
                            <button type="button" className={active ? 'active' : ''} onClick={() => setCategory(child.slug || child._id)} key={child._id}>
                              <span>{child.name}</span><b>{child.count || 0}</b>
                            </button>
                          );
                        })}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="filter-block price-filter-block">
            <h4>Prix</h4>
            <label>Prix minimum</label>
            <input type="number" min="0" placeholder="0" value={minPrice} onChange={(event) => updateFilter('minPrice', event.target.value)} />
            <label>Prix maximum</label>
            <div className="price-range-control">
              <input type="range" min="0" max={priceMax} value={maxPrice || priceMax} onChange={(event) => updateFilter('maxPrice', event.target.value)} aria-label="Prix maximum" />
            </div>
            <div className="range"><span>0 TND</span><span>{currency(maxPrice || priceMax)} TND</span></div>
          </div>

          {payload.filters.brands?.length ? (
            <div className="filter-block">
              <h4>Marques</h4>
              <select value={brand} onChange={(event) => updateFilter('brand', event.target.value)}>
                <option value="">Toutes les marques</option>
                {payload.filters.brands.map((item) => <option value={item} key={item}>{item}</option>)}
              </select>
            </div>
          ) : null}

          <label className="check-filter"><input type="checkbox" checked={inStock} onChange={(event) => updateFilter('inStock', event.target.checked ? 'true' : '')} /> Produits en stock uniquement</label>
        </aside>

        <section className="shop-main">
          <div className="sort-row sort-row-pro premium-sort-row">
            <b><span>{payload.total}</span> résultats {query && <>pour “{query}”</>}</b>
            <div>
              <span>Trier par :</span>
              <select value={sort} onChange={(event) => updateFilter('sort', event.target.value)}>
                <option value="popular">Les plus populaires</option>
                <option value="newest">Nouveautés</option>
                <option value="best-rated">Mieux notés</option>
                <option value="stock">Stock disponible</option>
                <option value="price-asc">Prix croissant</option>
                <option value="price-desc">Prix décroissant</option>
              </select>
              <button className={view === 'grid' ? 'active' : ''} onClick={() => setViewMode('grid')} aria-label="Vue grille"><Grid3X3 /></button>
              <button className={view === 'list' ? 'active' : ''} onClick={() => setViewMode('list')} aria-label="Vue liste"><List /></button>
            </div>
          </div>

          {loading ? <Loading /> : payload.items.length ? (
            <>
              <div className={view === 'list' ? 'products-grid product-list-view' : 'products-grid'}>
                {payload.items.map((product) => <ProductCard product={product} key={product._id} />)}
              </div>
              <div ref={loadMoreSentinel} className="load-more-sentinel" aria-hidden="true" />
              {payload.pages > 1 ? (
                <nav className="pagination-row" aria-label="Pagination des produits">
                  <button type="button" disabled={payload.page <= 1} onClick={() => { appendNextPage.current = false; updateFilter('page', payload.page - 1); }}><ChevronLeft size={18} /> Précédent</button>
                  <div className="pagination-pages">
                    {pageItems(payload.page, payload.pages).map((item) => typeof item === 'number' ? (
                      <button type="button" className={item === payload.page ? 'active' : ''} onClick={() => updateFilter('page', item)} aria-current={item === payload.page ? 'page' : undefined} key={item}>{item}</button>
                    ) : <span className="pagination-ellipsis" key={item}>…</span>)}
                  </div>
                  <button type="button" disabled={payload.page >= payload.pages} onClick={() => { appendNextPage.current = false; updateFilter('page', payload.page + 1); }}>Suivant <ChevronRight size={18} /></button>
                </nav>
              ) : null}
              {payload.page < payload.pages ? <div className="load-more-area">
                {loadingMore ? <div className="load-more-status" role="status"><LoaderCircle size={18} className="loading-spin" /><span>Chargement des produits suivants…</span></div> : null}
                <button className={`load-more-button ${loadingMore ? 'is-loading' : ''}`} type="button" onClick={() => { if (loadingMoreRef.current) return; loadingMoreRef.current = true; appendNextPage.current = true; setLoadingMore(true); updateFilter('page', payload.page + 1); }} disabled={loadingMore}>
                  {loadingMore ? <><LoaderCircle size={17} className="loading-spin" /> Chargement en cours</> : 'Charger plus de produits'}
                </button>
              </div> : null}
            </>
          ) : (
            <div className="empty-products"><SearchX size={54} /><h3>Aucun produit trouvé</h3><p>Ajoutez un produit dans le dashboard ou modifiez les filtres.</p><button onClick={clearFilters}>Réinitialiser</button></div>
          )}
        </section>
      </div>
    </>
  );
}
