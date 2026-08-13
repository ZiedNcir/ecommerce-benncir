import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, Edit, FolderTree, RefreshCw, Save, Search, Trash2, X } from 'lucide-react';
import { categoriesApi, getApiError } from '../../services/api.ts';
const empty={name:'',slug:'',description:'',image:'',parent:'',sortOrder:0,isActive:true};
const slugify=(v='')=>v.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');
export default function AdminCategories(){
 const [items,setItems]=useState([]),[form,setForm]=useState(empty),[editing,setEditing]=useState(null),[search,setSearch]=useState(''),[error,setError]=useState(''),[loading,setLoading]=useState(true),[open,setOpen]=useState({});
 async function load(){setLoading(true);try{setItems(await categoriesApi.list({includeInactive:true}));setError('')}catch(e){setError(getApiError(e))}finally{setLoading(false)}}
 useEffect(()=>{load()},[]);
 const roots=useMemo(()=>items.filter(i=>!i.parent),[items]); const children=(id)=>items.filter(i=>String(i.parent?._id||i.parent)===String(id));
 function change(e){const{name,value,type,checked}=e.target;setForm(f=>{const n={...f,[name]:type==='checkbox'?checked:value};if(name==='name'&&!editing)n.slug=slugify(value);return n})}
 function edit(c){setEditing(c._id);setForm({name:c.name||'',slug:c.slug||'',description:c.description||'',image:c.image||'',parent:c.parent?._id||c.parent||'',sortOrder:c.sortOrder||0,isActive:c.isActive!==false});window.scrollTo({top:0,behavior:'smooth'})}
 function reset(){setEditing(null);setForm(empty);setError('')}
 async function submit(e){e.preventDefault();try{const data={...form,parent:form.parent||null,sortOrder:Number(form.sortOrder||0)};editing?await categoriesApi.update(editing,data):await categoriesApi.create(data);reset();await load()}catch(err){setError(getApiError(err))}}
 async function remove(c){if(!confirm(`Supprimer « ${c.name} » et détacher ses liaisons ?`))return;try{await categoriesApi.remove(c._id,{force:true});await load()}catch(err){setError(getApiError(err))}}
 const filtered=items.filter(i=>[i.name,i.slug,i.description].join(' ').toLowerCase().includes(search.toLowerCase()));
 return <>
  <div className="admin-title"><div><h1>Catégories & sous-catégories</h1><p>Créez une arborescence : exemple Matériel → Marteaux.</p></div><button className="outline" onClick={load}><RefreshCw size={17}/>Actualiser</button></div>
  {error&&<p className="error-msg">{error}</p>}
  <form className="admin-panel admin-category-form" onSubmit={submit}>
   <div className="admin-form-head"><h2>{editing?'Modifier':'Nouvelle catégorie'}</h2>{editing&&<button type="button" className="outline" onClick={reset}><X size={16}/>Annuler</button>}</div>
   <div className="two"><label>Nom<input name="name" value={form.name} onChange={change} required/></label><label>Slug<input name="slug" value={form.slug} onChange={change} required/></label></div>
   <div className="two"><label>Catégorie parente<select name="parent" value={form.parent} onChange={change}><option value="">Catégorie principale</option>{items.filter(i=>i._id!==editing).map(i=><option key={i._id} value={i._id}>{i.parent?'↳ ':''}{i.name}</option>)}</select></label><label>Ordre<input type="number" name="sortOrder" value={form.sortOrder} onChange={change}/></label></div>
   <label>Description<textarea name="description" value={form.description} onChange={change} rows={3}/></label><label>Image URL<input name="image" value={form.image} onChange={change}/></label>
   <label className="check-filter"><input type="checkbox" name="isActive" checked={form.isActive} onChange={change}/>Active</label><button className="btn"><Save size={17}/>{editing?'Mettre à jour':'Créer'}</button>
  </form>
  <div className="admin-panel"><label className="admin-search"><Search size={18}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Rechercher..."/></label></div>
  <div className="category-tree-admin">
   {loading?<div className="admin-panel">Chargement...</div>:roots.filter(r=>filtered.includes(r)||children(r._id).some(c=>filtered.includes(c))).map(root=><div className="tree-root" key={root._id}>
    <div className="tree-row root"><button className="tree-toggle" onClick={()=>setOpen(o=>({...o,[root._id]:!o[root._id]}))}>{open[root._id]===false?<ChevronRight/>:<ChevronDown/>}</button><FolderTree/><span><b>{root.name}</b><small>{root.productCount||0} produits · {children(root._id).length} sous-catégories</small></span><div className="admin-actions"><button className="outline" onClick={()=>edit(root)}><Edit size={15}/>Modifier</button><button className="outline danger" onClick={()=>remove(root)}><Trash2 size={15}/></button></div></div>
    {open[root._id]!==false&&<div className="tree-children">{children(root._id).filter(c=>filtered.includes(c)).map(c=><div className="tree-row child" key={c._id}><span className="branch">└─</span><span><b>{c.name}</b><small>{c.productCount||0} produits</small></span><div className="admin-actions"><button className="outline" onClick={()=>edit(c)}><Edit size={15}/>Modifier</button><button className="outline danger" onClick={()=>remove(c)}><Trash2 size={15}/></button></div></div>)}{!children(root._id).length&&<p className="tree-empty">Aucune sous-catégorie.</p>}</div>}
   </div>)}
  </div>
 </>
}
