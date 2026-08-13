import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const productId = (product) => product?._id || product?.id;

export const useFavoriteStore = create<any>()(persist<any>((set, get) => ({
  items: [],
  toggle: (product) => set((state) => {
    const id = productId(product);
    if (!id) return state;
    const exists = state.items.some((item) => productId(item) === id);
    return { items: exists ? state.items.filter((item) => productId(item) !== id) : [...state.items, product] };
  }),
  remove: (id) => set((state) => ({ items: state.items.filter((item) => productId(item) !== id) })),
  has: (id) => get().items.some((item) => productId(item) === id),
  count: () => get().items.length,
  clear: () => set({ items: [] })
}), { name: 'bencir-favorites' }));
