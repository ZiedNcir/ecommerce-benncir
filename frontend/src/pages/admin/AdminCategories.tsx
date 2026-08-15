import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, Edit, FolderTree, Plus, RefreshCw, Search, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { categoriesApi, getApiError } from '../../services/api.ts';

export default function AdminCategories() {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState({});

  async function load() {
    setLoading(true);
    try {
      setItems(await categoriesApi.list({ includeInactive: true }));
      setError('');
    } catch (requestError) {
      setError(getApiError(requestError));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const roots = useMemo(() => items.filter((item) => !item.parent), [items]);
  const children = (id) => items.filter((item) => String(item.parent?._id || item.parent) === String(id));
  const filtered = items.filter((item) => [item.name, item.slug, item.description].join(' ').toLowerCase().includes(search.toLowerCase()));

  async function remove(category) {
    if (!window.confirm(`Supprimer « ${category.name} » et détacher ses liaisons ?`)) return;
    try {
      await categoriesApi.remove(category._id, { force: true });
      await load();
    } catch (requestError) {
      setError(getApiError(requestError));
    }
  }

  return <>
    <div className="admin-title">
      <div><h1>Catégories & sous-catégories</h1><p>Consultez et organisez votre arborescence de catégories.</p></div>
      <div className="dashboard-actions"><Link className="btn" to="/admin/categories/new"><Plus size={17} />Nouvelle catégorie</Link><button className="outline" onClick={load}><RefreshCw size={17} />Actualiser</button></div>
    </div>
    {error ? <p className="error-msg">{error}</p> : null}
    <div className="admin-panel"><label className="admin-search"><Search size={18} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Rechercher..." /></label></div>
    <div className="category-tree-admin">
      {loading ? <div className="admin-panel">Chargement...</div> : roots.filter((root) => filtered.includes(root) || children(root._id).some((child) => filtered.includes(child))).map((root) => <div className="tree-root" key={root._id}>
        <div className="tree-row root"><button className="tree-toggle" type="button" onClick={() => setOpen((current) => ({ ...current, [root._id]: !current[root._id] }))}>{open[root._id] === false ? <ChevronRight /> : <ChevronDown />}</button><FolderTree /><span><b>{root.name}</b><small>{root.productCount || 0} produits · {children(root._id).length} sous-catégories</small></span><div className="admin-actions"><Link className="outline" to={`/admin/categories/${root._id}`}><Edit size={15} />Modifier</Link><button className="outline danger" type="button" onClick={() => remove(root)}><Trash2 size={15} /></button></div></div>
        {open[root._id] !== false ? <div className="tree-children">{children(root._id).filter((child) => filtered.includes(child)).map((child) => <div className="tree-row child" key={child._id}><span className="branch">└─</span><span><b>{child.name}</b><small>{child.productCount || 0} produits</small></span><div className="admin-actions"><Link className="outline" to={`/admin/categories/${child._id}`}><Edit size={15} />Modifier</Link><button className="outline danger" type="button" onClick={() => remove(child)}><Trash2 size={15} /></button></div></div>)}{!children(root._id).length ? <p className="tree-empty">Aucune sous-catégorie.</p> : null}</div> : null}
      </div>)}
    </div>
  </>;
}
