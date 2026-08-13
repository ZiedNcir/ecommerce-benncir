import { Headphones, PackageCheck, RefreshCcw, ShieldCheck, Truck } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
const items: Array<[string, string, LucideIcon]>=[['Livraison rapide','Partout en Tunisie (24-48h)',Truck],['Paiement sécurisé','100% sécurisé et protégé',ShieldCheck],['Retour facile','30 jours pour retourner',RefreshCcw],['Service client 24/7','Nous sommes là pour vous',Headphones]];
export default function BenefitBar(){return <div className="benefits">{items.map(([a,b,Icon])=><div key={a}><Icon size={34}/><span><b>{a}</b><small>{b}</small></span></div>)}</div>}
