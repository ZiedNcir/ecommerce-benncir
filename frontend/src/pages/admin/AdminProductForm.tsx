import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight, BadgeCheck, Check, ChevronLeft, Eye, FileVideo,
  ImagePlus, PackagePlus, Plus, Save, Search, Star, Trash2, X
} from 'lucide-react';
import { categoriesApi, getApiError, productsApi } from '../../services/api.ts';

const emptyForm = {
  name: '', slug: '', sku: '', barcode: '', brand: 'INGCO', shortDescription: '', description: '',
  categories: [], images: [], imageInput: '', demoVideo: '', demoVideoType: 'url', demoVideoTitle: 'Vidéo démonstrative',
  price: '', stock: '', lowStockThreshold: 5, trackStock: true,
  isActive: true, publicationStatus: 'published', visibleOnSite: true, visibleInSearch: true, visibleOnHome: false,
  featured: false, newArrival: false, bestseller: false, recommended: false, badge: '', tags: '', rating: 5, reviews: 0,
  specifications: [{ key: '', value: '' }], seoTitle: '', seoDescription: '', seoKeywords: '',
  sourceName: '', sourceUrl: '', sourceExternalId: '', importedAt: null,
};

const steps = [
  { key: 'general', title: 'Informations', description: 'Identité du produit' },
  { key: 'categories', title: 'Catégories', description: 'Catégorie et sous-catégorie' },
  { key: 'media', title: 'Médias', description: 'Images et vidéo' },
  { key: 'commerce', title: 'Prix & stock', description: 'Vente et disponibilité' },
  { key: 'content', title: 'Description', description: 'Contenu et caractéristiques' },
  { key: 'seo', title: 'SEO', description: 'Référencement' },
  { key: 'publish', title: 'Publication', description: 'Contrôle final' },
];

const slugify = (value = '') => String(value).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const categoryId = (value) => value?._id || value || '';
const toTags = (value) => String(value || '').split(',').map((item) => item.trim()).filter(Boolean);
const money = (value) => `${Number(value || 0).toLocaleString('fr-TN', { maximumFractionDigits: 3 })} DT`;

export default function AdminProductForm() {
  const nav = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);
  const draftKey = `bencir-product-wizard-${id || 'new'}`;
  const [form, setForm] = useState(emptyForm);
  const [categories, setCategories] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState(new Set());
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [autosaveLabel, setAutosaveLabel] = useState('');
  const [activeImage, setActiveImage] = useState(0);
  const [subcategorySearch, setSubcategorySearch] = useState('');

  useEffect(() => {
    categoriesApi.list({ includeInactive: true })
      .then((data) => setCategories(Array.isArray(data) ? data : []))
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    let alive = true;
    async function load() {
      if (isEditing) {
        try {
          const product = await productsApi.one(id);
          if (!alive) return;
          setForm({
            ...emptyForm,
            ...product,
            categories: (product.categories?.length ? product.categories : [product.category]).filter(Boolean).map(categoryId),
            images: Array.isArray(product.images) ? product.images : [],
            tags: Array.isArray(product.tags) ? product.tags.join(', ') : (product.tags || ''),
            specifications: Array.isArray(product.specifications) && product.specifications.length ? product.specifications : [{ key: '', value: '' }],
          });
        } catch (err) {
          setError(getApiError(err, 'Produit introuvable'));
        } finally {
          if (alive) setLoading(false);
        }
      } else {
        const saved = localStorage.getItem(draftKey);
        if (saved) {
          try { setForm({ ...emptyForm, ...JSON.parse(saved) }); } catch { /* brouillon invalide ignoré */ }
        }
      }
    }
    load();
    return () => { alive = false; };
  }, [draftKey, id, isEditing]);

  useEffect(() => {
    if (loading) return undefined;
    const timer = window.setTimeout(() => {
      localStorage.setItem(draftKey, JSON.stringify(form));
      setAutosaveLabel(`Brouillon enregistré à ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`);
    }, 700);
    return () => window.clearTimeout(timer);
  }, [draftKey, form, loading]);

  const roots = useMemo(() => categories.filter((cat) => !cat.parent), [categories]);
  const primaryCategoryId = useMemo(() => {
    const selectedRoot = form.categories.find((value) => roots.some((root) => root._id === value));
    if (selectedRoot) return selectedRoot;
    const selectedChild = categories.find((cat) => form.categories.includes(cat._id) && cat.parent);
    return categoryId(selectedChild?.parent);
  }, [categories, form.categories, roots]);
  const allSubcategories = useMemo(() => categories.filter((cat) => categoryId(cat.parent) === primaryCategoryId), [categories, primaryCategoryId]);
  const subcategories = useMemo(() => {
    const query = subcategorySearch.trim().toLowerCase();
    return allSubcategories.filter((cat) => !query || cat.name.toLowerCase().includes(query));
  }, [allSubcategories, subcategorySearch]);
  const selectedSubcategoryId = useMemo(() => form.categories.find((value) => allSubcategories.some((cat) => cat._id === value)) || '', [allSubcategories, form.categories]);
  const previewImage = form.images[activeImage] || form.images[0] || '';

  const validation = useMemo(() => [
    Boolean(form.name.trim() && form.sku.trim()),
    Boolean(primaryCategoryId && selectedSubcategoryId),
    form.images.length > 0,
    Number(form.price) > 0 && Number(form.stock) >= 0 && Number(form.lowStockThreshold) >= 0,
    Boolean(form.shortDescription.trim() && form.description.trim()),
    Boolean((form.seoTitle || form.name).trim() && form.seoDescription.trim()),
    true,
  ], [form, primaryCategoryId, selectedSubcategoryId]);

  const qualityChecks: Array<[boolean, string]> = [
    [Boolean(form.name.trim()), 'Nom renseigné'],
    [Boolean(primaryCategoryId), 'Catégorie choisie'],
    [Boolean(selectedSubcategoryId), 'Sous-catégorie choisie'],
    [form.images.length > 0, 'Image principale ajoutée'],
    [Number(form.price) > 0, 'Prix de vente valide'],
    [form.description.trim().length > 80, 'Description détaillée'],
    [Boolean(form.sku.trim()), 'Référence SKU'],
    [Boolean((form.seoTitle || form.name).trim()), 'Titre SEO'],
  ];
  const qualityScore = Math.round((qualityChecks.filter(([valid]) => valid).length / qualityChecks.length) * 100);

  function change(event) {
    const { name, value, type, checked } = event.target;
    setForm((current) => {
      const next = { ...current, [name]: type === 'checkbox' ? checked : value };
      if (name === 'name' && !isEditing) next.slug = slugify(value);
      return next;
    });
  }

  function choosePrimary(value) {
    setForm((current) => ({ ...current, categories: value ? [value] : [] }));
    setSubcategorySearch('');
  }

  function chooseSubcategory(value) {
    setForm((current) => ({ ...current, categories: value ? [primaryCategoryId, value] : [primaryCategoryId] }));
  }

  function addImage() {
    const url = form.imageInput.trim();
    if (!url || form.images.includes(url)) return;
    setForm((current) => ({ ...current, images: [...current.images, url], imageInput: '' }));
    setActiveImage(form.images.length);
  }

  function removeImage(index) {
    setForm((current) => ({ ...current, images: current.images.filter((_, itemIndex) => itemIndex !== index) }));
    setActiveImage(0);
  }

  function makePrimary(index) {
    setForm((current) => {
      const images = [...current.images];
      const [selected] = images.splice(index, 1);
      images.unshift(selected);
      return { ...current, images };
    });
    setActiveImage(0);
  }

  function updateSpec(index, key, value) {
    setForm((current) => ({ ...current, specifications: current.specifications.map((spec, itemIndex) => itemIndex === index ? { ...spec, [key]: value } : spec) }));
  }
  function addSpec() { setForm((current) => ({ ...current, specifications: [...current.specifications, { key: '', value: '' }] })); }
  function removeSpec(index) { setForm((current) => ({ ...current, specifications: current.specifications.filter((_, itemIndex) => itemIndex !== index) })); }

  function validateStep(index) {
    const messages = [
      'Renseignez au minimum le nom et la référence SKU.',
      'Choisissez une catégorie et une sous-catégorie.',
      'Ajoutez au moins une image produit.',
      'Renseignez un prix de vente, le stock et le seuil d’alerte.',
      'Ajoutez une description courte et une description complète.',
      'Renseignez le titre SEO et la méta-description.',
      '',
    ];
    if (!validation[index]) {
      setError(messages[index]);
      return false;
    }
    setError('');
    setCompletedSteps((current) => new Set([...current, index]));
    return true;
  }

  function nextStep() {
    if (!validateStep(currentStep)) return;
    setCurrentStep((step) => Math.min(step + 1, steps.length - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function goToStep(index) {
    if (index <= currentStep || completedSteps.has(index - 1) || validation.slice(0, index).every(Boolean)) {
      setCurrentStep(index);
      setError('');
    }
  }

  async function save(mode = 'publish') {
    for (let index = 0; index < 6; index += 1) {
      if (!validation[index]) {
        setCurrentStep(index);
        validateStep(index);
        return;
      }
    }
    setSaving(true);
    setError('');
    const payload = {
      ...form,
      publicationStatus: mode === 'draft' ? 'draft' : form.publicationStatus,
      isActive: mode === 'draft' ? false : (form.publicationStatus === 'published' && form.visibleOnSite),
      category: primaryCategoryId,
      categories: [primaryCategoryId, selectedSubcategoryId].filter(Boolean),
      price: Number(form.price || 0), stock: Number(form.stock || 0), lowStockThreshold: Number(form.lowStockThreshold || 0),
      rating: Number(form.rating || 0), reviews: Number(form.reviews || 0), tags: toTags(form.tags),
      specifications: form.specifications.filter((item) => item.key.trim() && item.value.trim()),
    };
    delete payload.imageInput;
    try {
      if (isEditing) await productsApi.update(id, payload); else await productsApi.create(payload);
      localStorage.removeItem(draftKey);
      nav('/admin/products');
    } catch (err) {
      setError(getApiError(err, 'Impossible d’enregistrer le produit'));
    } finally { setSaving(false); }
  }

  if (loading) return <div className="admin-loading">Chargement du produit…</div>;

  return (
    <div className="admin-product-page product-wizard-page">
      <header className="product-editor-header wizard-heading">
        <div>
          <Link className="admin-back-link" to="/admin/products"><ArrowLeft size={18} /> Produits</Link>
          <div className="admin-heading-line">
            <span className="admin-heading-icon"><PackagePlus size={24} /></span>
            <div><h1>{isEditing ? 'Modifier le produit' : 'Créer un nouveau produit'}</h1><p>{isEditing ? 'Mettez à jour la fiche étape par étape sans perdre les données existantes.' : 'Complétez les étapes pour publier une fiche produit de qualité.'}</p></div>
          </div>
        </div>
        <div className="wizard-autosave"><Save size={16} /><span>{autosaveLabel || 'Sauvegarde automatique active'}</span></div>
      </header>

      <nav className="product-wizard-steps" aria-label="Étapes du produit">
        {steps.map((step, index) => {
          const done = completedSteps.has(index) || (index < currentStep && validation[index]);
          return <button type="button" key={step.key} className={`${currentStep === index ? 'active' : ''} ${done ? 'done' : ''}`} onClick={() => goToStep(index)}>
            <span>{done ? <Check size={16} /> : index + 1}</span>
            <div><strong>{step.title}</strong><small>{step.description}</small></div>
          </button>;
        })}
      </nav>

      {error && <div className="admin-form-alert">{error}</div>}

      <div className="wizard-layout">
        <main className="wizard-card admin-panel">
          <div className="wizard-card-title"><span>{currentStep + 1}</span><div><h2>{steps[currentStep].title}</h2><p>{steps[currentStep].description}</p></div></div>

          {currentStep === 0 && <section className="wizard-fields">
            <div className="two"><label>Nom du produit *<input name="name" value={form.name} onChange={change} placeholder="Ex. Perceuse sans fil 20 V" /></label><label>Référence SKU *<input name="sku" value={form.sku} onChange={change} placeholder="ING-CDLI20024" /></label></div>
            <div className="two"><label>Marque<input name="brand" value={form.brand} onChange={change} /></label><label>Code-barres<input name="barcode" value={form.barcode} onChange={change} /></label></div>
            <label>Slug<input name="slug" value={form.slug} onChange={change} placeholder="perceuse-sans-fil-20v" /></label>
          </section>}

          {currentStep === 1 && <section className="wizard-fields">
            <label>Catégorie principale *<select value={primaryCategoryId} onChange={(event) => choosePrimary(event.target.value)}><option value="">Sélectionner une catégorie</option>{roots.map((root) => <option key={root._id} value={root._id}>{root.name}</option>)}</select></label>
            <div className="subcategory-picker">
              <label>Sous-catégorie *</label>
              <div className="category-search"><Search size={18} /><input value={subcategorySearch} onChange={(event) => setSubcategorySearch(event.target.value)} placeholder="Rechercher une sous-catégorie" disabled={!primaryCategoryId} /></div>
              {!primaryCategoryId ? <p className="wizard-empty">Sélectionnez d’abord une catégorie principale.</p> : <div className="subcategory-choice-grid">{subcategories.map((subcategory) => <button type="button" key={subcategory._id} className={selectedSubcategoryId === subcategory._id ? 'selected' : ''} onClick={() => chooseSubcategory(subcategory._id)}><span>{selectedSubcategoryId === subcategory._id ? <Check size={16} /> : null}</span>{subcategory.name}</button>)}</div>}
            </div>
          </section>}

          {currentStep === 2 && <section className="wizard-fields">
            <div className="image-url-adder"><ImagePlus size={20} /><input name="imageInput" value={form.imageInput} onChange={change} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); addImage(); } }} placeholder="Coller l’URL d’une image" /><button type="button" className="outline" onClick={addImage}>Ajouter</button></div>
            <div className="wizard-media-grid">{form.images.map((image, index) => <article key={`${image}-${index}`} className={index === 0 ? 'primary' : ''}><img src={image} alt="" /><div><strong>{index === 0 ? 'Image principale' : `Image ${index + 1}`}</strong><div><button type="button" onClick={() => makePrimary(index)} disabled={index === 0}>Principale</button><button type="button" onClick={() => removeImage(index)}><Trash2 size={15} /></button></div></div></article>)}</div>
            <div className="two"><label>Type de vidéo<select name="demoVideoType" value={form.demoVideoType} onChange={change}><option value="url">URL directe</option><option value="youtube">YouTube</option><option value="vimeo">Vimeo</option><option value="upload">Fichier MP4</option></select></label><label>Titre de la vidéo<input name="demoVideoTitle" value={form.demoVideoTitle} onChange={change} /></label></div>
            <label>URL de la vidéo<div className="input-with-icon"><FileVideo size={18} /><input name="demoVideo" value={form.demoVideo} onChange={change} placeholder="https://…" /></div></label>
          </section>}

          {currentStep === 3 && <section className="wizard-fields">
            <div className="three"><label>Prix de vente (DT) *<input type="number" min="0" step="0.001" name="price" value={form.price} onChange={change} /></label><label>Stock disponible *<input type="number" min="0" name="stock" value={form.stock} onChange={change} /></label><label>Seuil d’alerte *<input type="number" min="0" name="lowStockThreshold" value={form.lowStockThreshold} onChange={change} /></label></div>
            <label className="toggle-line"><input type="checkbox" name="trackStock" checked={form.trackStock} onChange={change} /><span>Activer le suivi du stock</span></label>
            <div className="stock-alert-preview"><BadgeCheck size={20} /><div><strong>Alerte de stock</strong><p>Une alerte apparaîtra lorsque le stock atteindra {form.lowStockThreshold || 0} unité(s).</p></div></div>
          </section>}

          {currentStep === 4 && <section className="wizard-fields">
            <label>Description courte *<textarea name="shortDescription" value={form.shortDescription} onChange={change} rows={3} maxLength={220} /></label>
            <label>Description complète *<textarea name="description" value={form.description} onChange={change} rows={8} /></label>
            <label>Tags<input name="tags" value={form.tags} onChange={change} placeholder="perceuse, outil, sans fil" /></label>
            <div className="section-inline-action"><button type="button" className="outline compact" onClick={addSpec}><Plus size={16} /> Ajouter une caractéristique</button></div>
            <div className="spec-list">{form.specifications.map((spec, index) => <div className="spec-row" key={index}><input value={spec.key} onChange={(event) => updateSpec(index, 'key', event.target.value)} placeholder="Ex. Puissance" /><input value={spec.value} onChange={(event) => updateSpec(index, 'value', event.target.value)} placeholder="Ex. 20 V" /><button type="button" onClick={() => removeSpec(index)}><Trash2 size={17} /></button></div>)}</div>
          </section>}

          {currentStep === 5 && <section className="wizard-fields">
            <label>Titre SEO *<input name="seoTitle" value={form.seoTitle} onChange={change} placeholder={form.name || 'Titre affiché dans Google'} /></label>
            <label>Méta-description *<textarea name="seoDescription" value={form.seoDescription} onChange={change} rows={4} maxLength={160} /></label>
            <label>Mots-clés<input name="seoKeywords" value={form.seoKeywords} onChange={change} placeholder="outil, ingco, perceuse" /></label>
            <div className="seo-preview"><small>Aperçu Google</small><h3>{form.seoTitle || form.name || 'Titre du produit'}</h3><span>ben-ncir-commerce.tn/product/{form.slug || 'produit'}</span><p>{form.seoDescription || 'La méta-description apparaîtra ici.'}</p></div>
          </section>}

          {currentStep === 6 && <section className="wizard-fields publish-step">
            <div className="publication-grid">
              <div><h3>Statut</h3><label><input type="radio" name="publicationStatus" value="draft" checked={form.publicationStatus === 'draft'} onChange={change} /> Brouillon</label><label><input type="radio" name="publicationStatus" value="published" checked={form.publicationStatus === 'published'} onChange={change} /> Publié</label><label><input type="radio" name="publicationStatus" value="hidden" checked={form.publicationStatus === 'hidden'} onChange={change} /> Masqué</label></div>
              <div><h3>Visibilité</h3><label><input type="checkbox" name="visibleOnSite" checked={form.visibleOnSite} onChange={change} /> Boutique</label><label><input type="checkbox" name="visibleInSearch" checked={form.visibleInSearch} onChange={change} /> Recherche</label><label><input type="checkbox" name="visibleOnHome" checked={form.visibleOnHome} onChange={change} /> Accueil</label></div>
              <div><h3>Badges</h3><label><input type="checkbox" name="newArrival" checked={form.newArrival} onChange={change} /> Nouveau</label><label><input type="checkbox" name="bestseller" checked={form.bestseller} onChange={change} /> Meilleure vente</label><label><input type="checkbox" name="featured" checked={form.featured} onChange={change} /> Vedette</label></div>
            </div>
            <div className="quality-panel"><div><strong>Qualité de la fiche</strong><span>{qualityScore}%</span></div><progress value={qualityScore} max={100} />{qualityChecks.map(([valid, label]) => <p key={label} className={valid ? 'done' : ''}>{valid ? <Check size={15} /> : <X size={15} />}{label}</p>)}</div>
          </section>}

          <footer className="wizard-footer">
            <button type="button" className="outline" disabled={currentStep === 0} onClick={() => setCurrentStep((step) => Math.max(step - 1, 0))}><ChevronLeft size={18} /> Retour</button>
            <span>Étape {currentStep + 1} sur {steps.length}</span>
            {currentStep < steps.length - 1 ? <button type="button" className="btn" onClick={nextStep}>Suivant <ArrowRight size={18} /></button> : <div className="wizard-final-actions"><button type="button" className="outline" disabled={saving} onClick={() => save('draft')}><Save size={17} /> Brouillon</button><button type="button" className="btn" disabled={saving} onClick={() => save('publish')}><BadgeCheck size={17} /> {saving ? 'Enregistrement…' : isEditing ? 'Mettre à jour' : 'Publier'}</button></div>}
          </footer>
        </main>

        <aside className="wizard-preview admin-panel">
          <div className="preview-title"><div><Eye size={19} /><h2>Aperçu en direct</h2></div><span>{isEditing ? 'Modification' : 'Nouveau'}</span></div>
          <div className="admin-product-preview-card">
            <div className="preview-image-wrap">{previewImage ? <img src={previewImage} alt="Aperçu produit" /> : <div className="preview-placeholder"><ImagePlus size={36} /><span>Ajoutez une image</span></div>}{(form.badge || form.newArrival) && <span className="preview-badge">{form.badge || 'Nouveau'}</span>}</div>
            {form.images.length > 1 && <div className="preview-thumbs">{form.images.slice(0, 5).map((image, index) => <button type="button" className={activeImage === index ? 'active' : ''} onClick={() => setActiveImage(index)} key={`${image}-${index}`}><img src={image} alt="" /></button>)}</div>}
            <div className="preview-card-body"><small>{form.brand || 'Marque'} {form.sku ? `• ${form.sku}` : ''}</small><h3>{form.name || 'Nom du produit'}</h3><div className="preview-rating"><Star size={15} fill="currentColor" /> {form.rating || 5} <span>({form.reviews || 0})</span></div><p className="preview-description">{form.shortDescription || 'La description courte apparaîtra ici.'}</p><div className="preview-price">{money(form.price)}</div><div className={`preview-stock ${Number(form.stock) > 0 ? 'available' : 'empty'}`}>{Number(form.stock) > 0 ? `En stock • ${form.stock} unité(s)` : 'Rupture de stock'}</div><button type="button" className="btn full">Ajouter au panier</button></div>
          </div>
        </aside>
      </div>
    </div>
  );
}
