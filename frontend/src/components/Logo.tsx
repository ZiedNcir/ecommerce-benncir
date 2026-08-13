import { Leaf, Sprout } from 'lucide-react';

export default function Logo(){
  return (
    <div className="brand-logo" aria-label="BÊN NCÎR Commerce">
      <div className="brand-mark">
        <Leaf size={28}/>
        <Sprout size={18} className="brand-sprout"/>
      </div>
      <div className="brand-copy">
        <strong>BÊN NCÎR</strong>
        <span>COMMERCE</span>
      </div>
    </div>
  )
}
