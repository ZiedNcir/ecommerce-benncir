import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronRight, FolderTree, Search, Wrench } from 'lucide-react';
import Breadcrumb from '../../components/Breadcrumb.tsx';
import Loading from '../../components/Loading.tsx';
import { categoriesApi } from '../../services/api.ts';

export default function Categories(){
  const [tree,setTree]=useState([]); const [loading,setLoading]=useState(true); const [search,setSearch]=useState('');
  useEffect(()=>{categoriesApi.tree().then(setTree).finally(()=>setLoading(false))},[]);
  const filtered=useMemo(()=>tree.map(root=>({...root,children:(root.children||[]).filter(child=>`${root.name} ${child.name}`.toLowerCase().includes(search.toLowerCase()))})).filter(root=>root.name.toLowerCase().includes(search.toLowerCase())||root.children.length),[tree,search]);
  return <>
    <Breadcrumb items={[{label:'Catégories'}]}/>
    <section className="category-page-hero-v2"><div><span><FolderTree size={16}/> Catalogue organisé</span><h1>Trouvez rapidement l’outil qu’il vous faut.</h1><p>Explorez nos familles de produits, puis choisissez une sous-catégorie pour afficher directement les articles correspondants.</p></div><div className="category-hero-icon"><Wrench/></div></section>
    <section className="category-search-v2"><Search size={20}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Rechercher une catégorie ou une sous-catégorie..."/><span>{filtered.length} familles</span></section>
    {loading?<Loading/>:<>
      <section className="category-overview-v2">{filtered.slice(0,4).map(root=><Link to={`/products?category=${root.slug}`} key={root._id}><img src={root.image} alt={root.name}/><div><small>{root.children?.length||0} sous-catégories</small><b>{root.name}</b><span>Explorer <ArrowRight size={14}/></span></div></Link>)}</section>
      <section className="category-hierarchy-v2">{filtered.map(root=><article className="category-family-v2" key={root._id}>
        <Link className="family-banner-v2" to={`/products?category=${root.slug}`}><img src={root.image||'https://images.unsplash.com/photo-1581166397057-235af2b3c6dd?auto=format&fit=crop&w=900&q=80'} alt={root.name}/><div><small>Famille de produits</small><h2>{root.name}</h2><span>{root.productCount||0} produits <ArrowRight size={15}/></span></div></Link>
        <div className="subcategory-grid-v2">{(root.children||[]).map(child=><Link to={`/products?category=${child.slug}`} key={child._id}><span><b>{child.name}</b><small>{child.productCount||0} produits disponibles</small></span><ChevronRight size={18}/></Link>)}{!root.children?.length&&<p>Aucune sous-catégorie disponible.</p>}</div>
      </article>)}</section>
    </>}
  </>;
}
