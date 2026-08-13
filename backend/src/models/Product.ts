import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
  description: { type: String, required: true },
  shortDescription: { type: String, default: '' },
  purchasePrice: { type: Number, default: 0, min: 0 },
  priceHT: { type: Number, default: 0, min: 0 },
  taxRate: { type: Number, default: 19, min: 0 },
  price: { type: Number, required: true, min: 0 },
  oldPrice: { type: Number, default: 0, min: 0 },
  stock: { type: Number, default: 0, min: 0 },
  lowStockThreshold: { type: Number, default: 5, min: 0 },
  trackStock: { type: Boolean, default: true },
  images: [{ type: String, trim: true }],
  demoVideo: { type: String, default: '', trim: true },
  demoVideoType: { type: String, enum: ['url', 'youtube', 'vimeo', 'upload'], default: 'url' },
  demoVideoTitle: { type: String, default: 'Vidéo démonstrative', trim: true },
  categories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category', index: true }],
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  sku: { type: String, default: '', trim: true },
  barcode: { type: String, default: '', trim: true },
  brand: { type: String, default: '', trim: true },
  badge: { type: String, default: '' },
  rating: { type: Number, default: 5, min: 0, max: 5 },
  reviews: { type: Number, default: 0, min: 0 },
  tags: [{ type: String, trim: true }],
  featured: { type: Boolean, default: false },
  newArrival: { type: Boolean, default: false },
  bestseller: { type: Boolean, default: false },
  recommended: { type: Boolean, default: false },
  specifications: [{ key: { type: String, trim: true }, value: { type: String, trim: true } }],
  seoTitle: { type: String, default: '', trim: true },
  seoDescription: { type: String, default: '', trim: true },
  seoKeywords: { type: String, default: '', trim: true },
  isActive: { type: Boolean, default: true },
  publicationStatus: { type: String, enum: ['draft', 'published', 'hidden'], default: 'published', index: true },
  visibleOnSite: { type: Boolean, default: true, index: true },
  visibleInSearch: { type: Boolean, default: true, index: true },
  visibleOnHome: { type: Boolean, default: false, index: true },
  sourceName: { type: String, default: '', trim: true, index: true },
  sourceUrl: { type: String, default: '', trim: true, unique: true, sparse: true },
  sourceExternalId: { type: String, default: '', trim: true, index: true },
  importedAt: { type: Date, default: null }
}, { timestamps: true });

productSchema.pre('validate', function syncLegacyCategory(next) {
  if (this.category && (!this.categories || this.categories.length === 0)) this.categories = [this.category];
  if (this.categories?.length && !this.category) this.category = this.categories[0];
  next();
});

productSchema.index({ name: 'text', description: 'text', shortDescription: 'text', sku: 'text', brand: 'text', tags: 'text' });

export default mongoose.model('Product', productSchema);
