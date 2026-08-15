import { useEffect, useState } from 'react';
import { ArrowLeft, Save, X } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { categoriesApi, getApiError } from '../../services/api.ts';

const empty = { name: '', slug: '', description: '', image: '', parent: '', sortOrder: 0, isActive: true };
const slugify = (value = '') => value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

export default function AdminCategoryForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(empty);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(isEditing);

  useEffect(() => {
    let alive = true;
    categoriesApi.list({ includeInactive: true }).then((categories) => {
      if (!alive) return;
      setItems(categories);
      if (id) {
        const category = categories.find((item) => String(item._id) === String(id));
        if (!category) setError('Catégorie introuvable.');
        else setForm({ name: category.name || '', slug: category.slug || '', description: category.description || '', image: category.image || '', parent: category.parent?._id || category.parent || '', sortOrder: category.sortOrder || 0, isActive: category.isActive !== false });
      }
    }).catch((requestError) => { if (alive) setError(getApiError(requestError)); }).finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [id]);

  function change(event) {
    const { name, value, type, checked } = event.target;
    setForm((current) => {
      const next = { ...current, [name]: type === 'checkbox' ? checked : value };
      if (name === 'name' && !isEditing) next.slug = slugify(value);
      return next;
    });
  }

  async function submit(event) {
    event.preventDefault();
    try {
      const data = { ...form, parent: form.parent || null, sortOrder: Number(form.sortOrder || 0) };
      if (isEditing) await categoriesApi.update(id, data); else await categoriesApi.create(data);
      navigate('/admin/categories');
    } catch (requestError) {
      setError(getApiError(requestError));
    }
  }

  if (loading) return <div className="admin-panel admin-loading">Chargement de la catégorie...</div>;

  return <>
    <div className="admin-title">
      <div><span className="eyebrow">{isEditing ? 'Modification' : 'Création'}</span><h1>{isEditing ? 'Modifier une catégorie' : 'Créer une catégorie'}</h1><p>{isEditing ? `Mettez à jour « ${form.name || 'la catégorie sélectionnée'} ».` : 'Ajoutez une nouvelle catégorie à votre arborescence.'}</p></div>
      <Link className="outline" to="/admin/categories"><ArrowLeft size={17} />Retour aux catégories</Link>
    </div>
    {error ? <p className="error-msg">{error}</p> : null}
    <form className={`admin-panel admin-category-form ${isEditing ? 'is-editing' : 'is-creating'}`} onSubmit={submit}>
      <div className="admin-form-head"><div><span className="category-form-kicker">{isEditing ? 'Écran de modification' : 'Écran de création'}</span><h2>{isEditing ? 'Informations de la catégorie' : 'Nouvelle catégorie'}</h2><p className="category-form-context">{isEditing ? 'Les changements seront enregistrés sur cette catégorie existante.' : 'Renseignez les informations de la nouvelle catégorie.'}</p></div>{isEditing ? <Link className="outline" to="/admin/categories"><X size={16} />Annuler la modification</Link> : null}</div>
      <div className="two"><label>Nom<input name="name" value={form.name} onChange={change} required /></label><label>Slug<input name="slug" value={form.slug} onChange={change} required /></label></div>
      <div className="two"><label>Catégorie parente<select name="parent" value={form.parent} onChange={change}><option value="">Catégorie principale</option>{items.filter((item) => item._id !== id).map((item) => <option value={item._id} key={item._id}>{item.parent ? '↳ ' : ''}{item.name}</option>)}</select></label><label>Ordre<input type="number" name="sortOrder" value={form.sortOrder} onChange={change} /></label></div>
      <label>Description<textarea name="description" value={form.description} onChange={change} rows={3} /></label><label>Image URL<input name="image" value={form.image} onChange={change} /></label>
      <label className="check-filter"><input type="checkbox" name="isActive" checked={form.isActive} onChange={change} />Active</label><button className="btn"><Save size={17} />{isEditing ? 'Enregistrer les modifications' : 'Créer la catégorie'}</button>
    </form>
  </>;
}
