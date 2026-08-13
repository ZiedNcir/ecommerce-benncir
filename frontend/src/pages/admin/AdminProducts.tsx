import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Edit, Eye, Plus, Search, Trash2, X } from 'lucide-react';
import { productsApi } from '../../services/api.ts';
import { products as fallback } from '../../assets/mockData.ts';

export default function AdminProducts() {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [imageViewer, setImageViewer] = useState(null);

  useEffect(() => {
    productsApi.list({ includeInactive: true }).then((data) => setItems(Array.isArray(data) ? data : data.items || [])).catch(() => setItems(fallback));
  }, []);

  const filtered = useMemo(() => items.filter((product) => [product.name, product.sku, product.brand].join(' ').toLowerCase().includes(search.toLowerCase())), [items, search]);

  async function remove(product) {
    if (!window.confirm(`Supprimer définitivement le produit "${product.name}" ?`)) return;
    await productsApi.remove(product._id || product.id);
    setItems((current) => current.filter((item) => String(item._id || item.id) !== String(product._id || product.id)));
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
        <div className="admin-stat-card"><strong>{items.length}</strong><span>Produits</span></div>
        <div className="admin-stat-card"><strong>{items.filter((item) => Number(item.stock || 0) > 0).length}</strong><span>En stock</span></div>
        <div className="admin-stat-card"><strong>{items.filter((item) => item.featured).length}</strong><span>Mis en avant</span></div>
      </div>
      <div className="admin-panel">
        <label className="admin-search"><Search size={18} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Rechercher produit, SKU, marque..." /></label>
      </div>
      <div className="admin-table-wrap">
        <table>
          <thead><tr><th>Image</th><th>Produit</th><th>Catégories</th><th>Prix</th><th>Stock</th><th>Statut</th><th></th></tr></thead>
          <tbody>{filtered.map((product) => {
            const categories = product.categories?.length ? product.categories : [product.category].filter(Boolean);
            return <tr key={product._id || product.id}>
              <td><button className="admin-image-button" type="button" onClick={() => setImageViewer(product)} aria-label={`Consulter les images de ${product.name}`}><img className="mini" src={product.image || product.images?.[0]} alt="" /><Eye size={16} /></button></td>
              <td><b>{product.name}</b><br /><small>{product.sku || product.brand}</small></td>
              <td>{categories.map((category) => category?.name || category).join(', ') || '-'}</td>
              <td>{product.price} DT</td>
              <td>{product.stock}</td>
              <td>{product.isActive === false ? 'Inactif' : 'Actif'}</td>
              <td className="admin-actions"><Link className="outline" to={`/admin/products/${product._id || product.id}`}><Edit size={16} /> Modifier</Link><button className="outline danger" type="button" onClick={() => remove(product)}><Trash2 size={16} /> Supprimer</button></td>
            </tr>;
          })}</tbody>
        </table>
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
