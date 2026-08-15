import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Edit, Eye, Plus, Search, Trash2, X } from 'lucide-react';
import { productsApi } from '../../services/api.ts';
import ImageWithSkeleton from '../../components/ImageWithSkeleton.tsx';

export default function AdminProducts() {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [imageViewer, setImageViewer] = useState(null);
  const limit = 24;

  useEffect(() => {
    productsApi.list({ includeInactive: true, meta: true, page, limit, ...(search.trim() ? { search: search.trim() } : {}) })
      .then((data) => {
        if (Array.isArray(data)) {
          setItems(data);
          setTotal(data.length);
          setPages(1);
          return;
        }
        setItems(data.items || []);
        setTotal(data.total || 0);
        setPages(data.pages || 1);
      })
      .catch(() => {
        setItems([]);
        setTotal(0);
        setPages(1);
      });
  }, [page, search]);

  async function remove(product) {
    if (!window.confirm(`Désactiver le produit "${product.name}" ? Il restera conservé dans l’historique.`)) return;
    await productsApi.remove(product._id || product.id);
    setItems((current) => current.filter((item) => String(item._id || item.id) !== String(product._id || product.id)));
    setTotal((current) => Math.max(0, current - 1));
    if (items.length === 1 && page > 1) setPage((current) => current - 1);
  }

  return (
    <>
      <div className="admin-title">
        <div>
          <h1>Produits</h1>
          <p>Gestion complète des produits, stock, prix, images et catégories multiples.</p>
        </div>
        <Link className="btn" to="/admin/products/new"><Plus size={18} /> Nouveau produit</Link>
      </div>
      <div className="admin-card-grid">
        <div className="admin-stat-card"><strong>{total}</strong><span>Produits au total</span></div>
        <div className="admin-stat-card"><strong>{items.filter((item) => Number(item.stock || 0) > 0).length}</strong><span>En stock sur cette page</span></div>
        <div className="admin-stat-card"><strong>{items.filter((item) => item.featured).length}</strong><span>Mis en avant sur cette page</span></div>
      </div>
      <div className="admin-panel">
        <label className="admin-search"><Search size={18} /><input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Rechercher produit, SKU, marque..." /></label>
      </div>
      <div className="admin-table-wrap">
        <table>
          <thead><tr><th>Image</th><th>Produit</th><th>Catégories</th><th>Prix</th><th>Stock</th><th>Statut</th><th></th></tr></thead>
          <tbody>{items.map((product) => {
            const categories = product.categories?.length ? product.categories : [product.category].filter(Boolean);
            return <tr key={product._id || product.id}>
              <td><button className="admin-image-button" type="button" onClick={() => setImageViewer(product)} aria-label={`Consulter les images de ${product.name}`}><ImageWithSkeleton wrapperClassName="mini" src={product.image || product.images?.[0]} alt="" /><Eye size={16} /></button></td>
              <td><b>{product.name}</b><br /><small>{product.sku || product.brand}</small></td>
              <td>{categories.map((category) => category?.name || category).join(', ') || '-'}</td>
              <td>{product.price} DT</td>
              <td>{product.stock}</td>
              <td><span className={`status-badge ${product.isActive === false ? 'archived' : 'published'}`}>{product.isActive === false ? 'Inactif' : 'Actif'}</span></td>
              <td className="admin-actions"><Link className="outline" to={`/admin/products/${product._id || product.id}`}><Edit size={16} /> Modifier</Link><button className="outline danger" type="button" onClick={() => remove(product)}><Trash2 size={16} /> Supprimer</button></td>
            </tr>;
          })}</tbody>
        </table>
      </div>
      <div className="admin-pagination" aria-label="Pagination des produits">
        <button type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page <= 1}><ChevronLeft size={16} /> Précédent</button>
        <span>Page {page} sur {pages} <small>({total} produit{total === 1 ? '' : 's'})</small></span>
        <button type="button" onClick={() => setPage((current) => Math.min(pages, current + 1))} disabled={page >= pages}>Suivant <ChevronRight size={16} /></button>
      </div>
      {imageViewer ? <div className="admin-modal-backdrop" role="presentation" onClick={() => setImageViewer(null)}>
        <section className="admin-image-modal" role="dialog" aria-modal="true" aria-label={`Images de ${imageViewer.name}`} onClick={(event) => event.stopPropagation()}>
          <button className="modal-close" type="button" onClick={() => setImageViewer(null)} aria-label="Fermer"><X /></button>
          <h2>{imageViewer.name}</h2>
          <p>{imageViewer.images?.length || (imageViewer.image ? 1 : 0)} image(s) enregistrée(s)</p>
          <div className="admin-image-gallery">{(imageViewer.images?.length ? imageViewer.images : [imageViewer.image].filter(Boolean)).map((image, index) => <a href={image} target="_blank" rel="noreferrer" key={`${image}-${index}`}><img src={image} alt={`${imageViewer.name} ${index + 1}`} /><span>Ouvrir l’original</span></a>)}</div>
          {!(imageViewer.images?.length || imageViewer.image) ? <p>Aucune image disponible pour ce produit.</p> : null}
        </section>
      </div> : null}
    </>
  );
}
