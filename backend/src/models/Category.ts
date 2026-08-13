import mongoose from 'mongoose';

const slugify = (value = '') => String(value)
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/(^-|-$)/g, '');

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, unique: true, lowercase: true, trim: true },
  description: { type: String, default: '', trim: true },
  image: { type: String, default: '', trim: true },
  parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
  sortOrder: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

categorySchema.pre('validate', function prepareCategory(next) {
  if (!this.slug && this.name) this.slug = slugify(this.name);
  next();
});

categorySchema.index({ name: 'text', description: 'text', slug: 'text' });

export default mongoose.model('Category', categorySchema);
