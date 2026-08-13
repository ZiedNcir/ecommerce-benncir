import mongoose from 'mongoose';

const contactMessageSchema = new mongoose.Schema({
  fullName: { type: String, required: true, trim: true, maxlength: 120 },
  email: { type: String, required: true, trim: true, lowercase: true, maxlength: 180 },
  phone: { type: String, default: '', trim: true, maxlength: 40 },
  subject: {
    type: String,
    required: true,
    enum: ['Commande', 'Livraison', 'Retour produit', 'Autre demande'],
  },
  message: { type: String, required: true, trim: true, maxlength: 3000 },
  status: { type: String, enum: ['new', 'read', 'replied', 'archived'], default: 'new', index: true },
  adminNote: { type: String, default: '', trim: true, maxlength: 2000 },
  readAt: { type: Date, default: null },
}, { timestamps: true });

contactMessageSchema.index({ fullName: 'text', email: 'text', subject: 'text', message: 'text' });

export default mongoose.model('ContactMessage', contactMessageSchema);

