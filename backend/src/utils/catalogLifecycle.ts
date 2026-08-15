import Category from '../models/Category.ts';
import Product from '../models/Product.ts';

export function buildProductDeactivationUpdate() {
  return {
    isActive: false,
    visibleOnSite: false,
    visibleInSearch: false,
    publicationStatus: 'hidden',
  } as const;
}

export function buildCategoryDeactivationUpdate() {
  return { isActive: false } as const;
}

export async function deactivateProduct(id: string) {
  return Product.findByIdAndUpdate(id, buildProductDeactivationUpdate(), { new: true, runValidators: true });
}

export async function deactivateCategory(id: string, force: boolean) {
  const childCount = await Category.countDocuments({ parent: id });
  if (childCount && !force) throw Object.assign(new Error(`Cette catégorie contient ${childCount} sous-catégorie(s). Utilisez force=true pour désactiver.`), { statusCode: 409 });

  const linkedProducts = await Product.countDocuments({ categories: id, isActive: true });
  if (linkedProducts && !force) throw Object.assign(new Error(`Cette catégorie est utilisée par ${linkedProducts} produit(s). Utilisez force=true.`), { statusCode: 409 });

  if (force) {
    await Category.updateMany({ parent: id }, { $set: { parent: null } });
    await Product.updateMany({ categories: id }, { $pull: { categories: id } });
  }

  return Category.findByIdAndUpdate(id, buildCategoryDeactivationUpdate(), { new: true, runValidators: true });
}
