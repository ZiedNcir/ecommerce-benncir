import { create } from 'zustand';
import { persist } from 'zustand/middleware';
export const useCartStore = create<any>()(persist<any>((set,get)=>({
  items:[],
  add:(product, qty=1)=>{ window.dispatchEvent(new CustomEvent('cart:item-added',{detail:{name:product.name,qty,image:product.image||product.images?.[0]}})); set(state=>{ const id=product._id || product.id; const found=state.items.find(i=>(i._id||i.id)===id); if(found) return {items:state.items.map(i=>(i._id||i.id)===id?{...i,qty:i.qty+qty}:i)}; return {items:[...state.items,{...product,qty}]}; }); },
  dec:(id)=>set(state=>({items:state.items.map(i=>(i._id||i.id)===id?{...i,qty:Math.max(1,i.qty-1)}:i)})),
  inc:(id)=>set(state=>({items:state.items.map(i=>(i._id||i.id)===id?{...i,qty:i.qty+1}:i)})),
  remove:(id)=>set(state=>({items:state.items.filter(i=>(i._id||i.id)!==id)})),
  clear:()=>set({items:[]}),
  count:()=>get().items.reduce((s,i)=>s+i.qty,0),
  subtotal:()=>get().items.reduce((s,i)=>s+i.price*i.qty,0)
}),{name:'bencir-cart'}));
