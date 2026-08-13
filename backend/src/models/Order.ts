import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  name: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  quantity: { type: Number, required: true, min: 1 },
  image: String,
  categories: [{ _id: mongoose.Schema.Types.ObjectId, name: String, slug: String }]
}, { _id: false });

const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, unique: true, index: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  customer: {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    governorate: { type: String, default: '', trim: true },
    postalCode: { type: String, default: '', trim: true },
    country: { type: String, default: 'Tunisie', trim: true }
  },
  delivery: {
    method: { type: String, enum: ['home_delivery'], default: 'home_delivery' },
    label: { type: String, default: 'Livraison à domicile' },
    fee: { type: Number, default: 7, min: 0 }
  },
  items: { type: [orderItemSchema], validate: [(items) => items.length > 0, 'Order must contain at least one item'] },
  subtotal: { type: Number, required: true, min: 0 },
  deliveryFee: { type: Number, default: 7, min: 0 },
  total: { type: Number, required: true, min: 0 },
  status: { type: String, enum: ['pending', 'confirmed', 'preparing', 'shipped', 'delivered', 'cancelled'], default: 'pending' },
  statusHistory: [{
    status: { type: String, enum: ['pending', 'confirmed', 'preparing', 'shipped', 'delivered', 'cancelled'], required: true },
    changedAt: { type: Date, default: Date.now },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    note: { type: String, default: '', trim: true, maxlength: 500 },
  }],
  stockRestored: { type: Boolean, default: false },
  paymentMethod: { type: String, enum: ['cash_on_delivery'], default: 'cash_on_delivery' },
  note: { type: String, default: '', trim: true },
  adminEmailSent: { type: Boolean, default: false },
  adminEmailError: { type: String, default: '' }
}, { timestamps: true });

orderSchema.pre('validate', function prepareOrder(next) {
  if (!this.orderNumber) this.orderNumber = `BNC-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 900 + 100)}`;
  this.deliveryFee = 7;
  this.delivery = { method: 'home_delivery', label: 'Livraison à domicile', fee: 7 };
  const computedSubtotal = Array.from(this.items || []).reduce((sum: number, item: any) => sum + Number(item.price || 0) * Number(item.quantity || 0), 0);
  this.subtotal = Number.isFinite(Number(this.subtotal)) && Number(this.subtotal) > 0 ? Number(this.subtotal) : computedSubtotal;
  this.total = this.subtotal + 7;
  if (!this.statusHistory?.length) this.statusHistory.push({ status: this.status || 'pending', changedAt: new Date(), note: '' });
  next();
});

export default mongoose.model('Order', orderSchema);
