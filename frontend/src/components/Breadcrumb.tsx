import { Link } from 'react-router-dom';import { ChevronRight, Home } from 'lucide-react';
export default function Breadcrumb({items=[]}){return <div className="breadcrumb"><Link to="/"><Home size={16}/>Accueil</Link>{items.map((it,i)=><span key={i}><ChevronRight size={14}/>{it.href?<Link to={it.href}>{it.label}</Link>:it.label}</span>)}</div>}
