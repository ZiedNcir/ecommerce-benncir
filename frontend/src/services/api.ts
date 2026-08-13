import axios from 'axios';
import { categories as demoCategories, products as demoProducts } from '../assets/mockData.ts';

export const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/$/, '');
export const DEMO_MODE = String(import.meta.env.VITE_ENABLE_DEMO || 'false') === 'true';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 12000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const code = error.response?.data?.code;
    const isAdminRoute = window.location.pathname.startsWith('/admin');

    if (status === 401 && isAdminRoute && code !== 'AUTH_INVALID_LOGIN') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/admin/login') {
        window.location.href = '/admin/login?session=expired';
      }
    }

    return Promise.reject(error);
  },
);

const wait = (value, ms = 320) => new Promise((resolve) => setTimeout(() => resolve(value), ms));
const slugify = (value = '') => String(value).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const normalizedCategories = (demoCategories as any[]).map((category) => ({
  ...category,
  _id: category._id || category.id,
  slug: category.slug || category.id || slugify(category.name),
}));


const demoCategoryTree = normalizedCategories
  .filter((category) => !category.parent)
  .map((root) => ({
    ...root,
    children: normalizedCategories.filter((category) => category.parent === root._id || category.parent === root.id || category.parent === root.slug),
  }));

const categoryByKey = (key) => normalizedCategories.find((category) => [category._id, category.id, category.slug, category.name].includes(key));

const normalizedProducts = (demoProducts as any[]).map((product, index) => {
  const category = categoryByKey(product.category) || normalizedCategories[index % normalizedCategories.length];
  return {
    ...product,
    _id: product._id || product.id || `demo-${index + 1}`,
    id: product._id || product.id || `demo-${index + 1}`,
    slug: product.slug || slugify(product.name),
    brand: product.brand || ['Apple', 'Samsung', 'Sony', 'Ben Ncir', 'JBL', 'Canon'][index % 6],
    sku: product.sku || `BNC-${String(index + 1).padStart(4, '0')}`,
    description: product.description || `Produit premium ${product.name}, sélectionné pour BÊN NCÎR COMMERCE avec une fiche claire, un stock contrôlé et une livraison disponible partout en Tunisie.`,
    features: product.features || ['Qualité contrôlée', 'Garantie commerciale', 'Livraison rapide', 'Service client disponible'],
    colors: product.colors || ['Noir', 'Argent', 'Gold'],
    category,
    categories: product.categories || [category].filter(Boolean),
    categoryName: category?.name,
    createdAt: product.createdAt || new Date(Date.now() - index * 86400000).toISOString(),
  };
});

function filterProducts(params: any = {}) {
  const search = String(params.search || '').trim().toLowerCase();
  const category = String(params.category || '').trim();
  const minPrice = Number(params.minPrice || 0);
  const maxPrice = params.maxPrice ? Number(params.maxPrice) : Infinity;
  const brand = String(params.brand || '').trim();
  const inStock = params.inStock === true || params.inStock === 'true';
  const sort = params.sort || 'popular';
  const page = Number(params.page || 1);
  const limit = Number(params.limit || 24);

  let items = [...normalizedProducts].filter((product) => {
    const productCategory = product.category;
    const matchesSearch = !search || [product.name, product.description, product.brand, productCategory?.name].join(' ').toLowerCase().includes(search);
    const productCategories = Array.isArray(product.categories) ? product.categories : [productCategory].filter(Boolean);
    const matchesCategory = !category || productCategories.some((cat) => [cat?._id, cat?.id, cat?.slug, cat?.name].includes(category)) || [productCategory?._id, productCategory?.id, productCategory?.slug, product.category].includes(category);
    const matchesPrice = Number(product.price) >= minPrice && Number(product.price) <= maxPrice;
    const matchesBrand = !brand || product.brand === brand;
    const matchesStock = !inStock || Number(product.stock || 0) > 0;
    return matchesSearch && matchesCategory && matchesPrice && matchesBrand && matchesStock;
  });

  if (sort === 'newest') items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  if (sort === 'best-rated') items.sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0));
  if (sort === 'stock') items.sort((a, b) => Number(b.stock || 0) - Number(a.stock || 0));
  if (sort === 'price-asc') items.sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
  if (sort === 'price-desc') items.sort((a, b) => Number(b.price || 0) - Number(a.price || 0));
  if (params.featured) items = items.filter((product) => product.badge || product.rating >= 4.6).slice(0, 8);

  const total = items.length;
  const pages = Math.max(1, Math.ceil(total / limit));
  const paginated = items.slice((page - 1) * limit, page * limit);
  const brands = [...new Set(normalizedProducts.map((product) => product.brand).filter(Boolean))];
  const prices = normalizedProducts.map((product) => Number(product.price || 0));
  const filters = {
    categories: normalizedCategories.map((cat) => ({ ...cat, count: normalizedProducts.filter((product) => product.category?.slug === cat.slug).length })),
    brands,
    price: { min: Math.min(...prices), max: Math.max(...prices) },
  };

  return params.meta ? { items: paginated, total, page, pages, filters } : paginated;
}

const withDemoFallback = (request, fallbackFactory) => request.catch((error) => {
  if (!DEMO_MODE) throw error;
  return wait(typeof fallbackFactory === 'function' ? fallbackFactory() : fallbackFactory);
});

export function getApiError(error, fallback = 'Une erreur est survenue') {
  return error.response?.data?.message || error.message || fallback;
}

export const productsApi = {
  list: (params = {}) => withDemoFallback(api.get('/products', { params }).then((r) => r.data), () => filterProducts(params)),
  one: (id) => withDemoFallback(api.get(`/products/${id}`).then((r) => r.data), () => normalizedProducts.find((product) => [product._id, product.id, product.slug].includes(id)) || normalizedProducts[0]),
  create: (data) => withDemoFallback(api.post('/products', data).then((r) => r.data), () => ({ ...data, _id: `demo-${Date.now()}` })),
  update: (id, data) => withDemoFallback(api.put(`/products/${id}`, data).then((r) => r.data), () => ({ ...data, _id: id })),
  remove: (id) => withDemoFallback(api.delete(`/products/${id}`).then((r) => r.data), () => ({ success: true, id })),
};

export const categoriesApi = {
  tree: (params = {}) => withDemoFallback(api.get('/categories/tree', { params }).then((r) => r.data), demoCategoryTree),
  one: (id) => api.get(`/categories/${id}`).then((r) => r.data),
  list: (params = {}) => withDemoFallback(api.get('/categories', { params }).then((r) => r.data), normalizedCategories),
  create: (data) => withDemoFallback(api.post('/categories', data).then((r) => r.data), () => ({ ...data, _id: `cat-${Date.now()}`, slug: slugify(data.name) })),
  update: (id, data) => withDemoFallback(api.put(`/categories/${id}`, data).then((r) => r.data), () => ({ ...data, _id: id })),
  remove: (id, params = {}) => withDemoFallback(api.delete(`/categories/${id}`, { params }).then((r) => r.data), () => ({ success: true, id })),
};

export const ordersApi = {
  one: (id) => api.get(`/orders/${id}`).then((r) => r.data),
  list: (params = {}) => withDemoFallback(api.get('/orders', { params }).then((r) => r.data), { items: [], total: 0, page: 1, pages: 1 }),
  create: (data) => withDemoFallback(api.post('/orders', data).then((r) => r.data), () => ({ ...data, _id: `order-${Date.now()}`, status: 'confirmed' })),
  myOrders: () => withDemoFallback(api.get('/orders/my-orders').then((r) => r.data), []),
  update: (id, data) => withDemoFallback(api.patch(`/orders/${id}/status`, data).then((r) => r.data), () => ({ ...data, _id: id })),
  remove: (id) => withDemoFallback(api.delete(`/orders/${id}`).then((r) => r.data), () => ({ success: true, id })),
  analytics: () => withDemoFallback(api.get('/orders/analytics/dashboard').then((r) => r.data), { totals: { orders: 0, revenue: 0, averageOrder: 0 }, currentMonth: { orders: 0, revenue: 0 }, growth: 0, statusStats: [], dailyRevenue: [], recentOrders: [] }),
};

export const usersApi = {
  list: (params = {}) => withDemoFallback(api.get('/users', { params }).then((r) => r.data), []),
  create: (data) => withDemoFallback(api.post('/users', data).then((r) => r.data), () => ({ ...data, _id: `user-${Date.now()}` })),
  update: (id, data) => withDemoFallback(api.put(`/users/${id}`, data).then((r) => r.data), () => ({ ...data, _id: id })),
  updateRole: (id, data) => withDemoFallback(api.patch(`/users/${id}/role`, data).then((r) => r.data), () => ({ ...data, _id: id })),
  remove: (id) => withDemoFallback(api.delete(`/users/${id}`).then((r) => r.data), () => ({ success: true, id })),
};

export const contactApi = {
  create: (data) => withDemoFallback(
    api.post('/contact', data).then((r) => r.data),
    () => ({ _id: `message-${Date.now()}`, status: 'new', message: 'Votre message a bien été transmis' }),
  ),
  list: (params = {}) => withDemoFallback(
    api.get('/contact', { params }).then((r) => r.data),
    { items: [], total: 0, unread: 0, page: 1, pages: 1 },
  ),
  one: (id) => api.get(`/contact/${id}`).then((r) => r.data),
  update: (id, data) => withDemoFallback(api.patch(`/contact/${id}`, data).then((r) => r.data), () => ({ ...data, _id: id })),
  remove: (id) => withDemoFallback(api.delete(`/contact/${id}`).then((r) => r.data), () => ({ success: true, id })),
};

export const authApi = {
  login: (data) => withDemoFallback(api.post('/auth/login', data).then((r) => r.data), () => ({ token: 'demo-token', user: { name: 'Admin Demo', email: data.email, role: 'admin' } })),
  register: (data) => withDemoFallback(api.post('/auth/register', data).then((r) => r.data), () => ({ token: 'demo-token', user: { name: data.name, email: data.email, role: 'client' } })),
  createAdmin: (data) => withDemoFallback(api.post('/auth/admin', data).then((r) => r.data), () => ({ user: { ...data, role: 'admin' } })),
  setupAdmin: (data) => withDemoFallback(api.post('/auth/setup-admin', data).then((r) => r.data), () => ({ token: 'demo-token', user: { name: data.name, email: data.email, role: 'admin' } })),
  me: () => withDemoFallback(api.get('/auth/me').then((r) => r.data), { name: 'Admin Demo', email: 'admin@bencir.tn', role: 'admin' }),
};

export default api;
