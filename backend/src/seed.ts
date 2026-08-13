import dotenv from 'dotenv';
import connectDB from './config/db.ts';
import User from './models/User.ts';
import Category from './models/Category.ts';
import Product from './models/Product.ts';
import { catalogCategories } from './data/catalogCategories.ts';

dotenv.config();
await connectDB();

await User.deleteMany();
await Category.deleteMany();
await Product.deleteMany();

const admin = await User.create({
  name: 'Bên Ncîr Admin',
  email: process.env.SEED_ADMIN_EMAIL || 'admin@bencir.tn',
  password: process.env.SEED_ADMIN_PASSWORD || 'password',
  role: 'admin',
});



const rootCategories = [];
for (const rootData of catalogCategories) {
  const { children, ...rootFields } = rootData;
  const root = await Category.create(rootFields);
  rootCategories.push(root);
  if (children?.length) {
    await Category.insertMany(children.map(([name, slug], index) => ({
      name,
      slug,
      description: `${name} : sélection spécialisée pour professionnels et bricoleurs.`,
      parent: root._id,
      sortOrder: (index + 1) * 10,
      isActive: true,
    })));
  }
}

const categories = rootCategories;


console.log('Seed completed');
console.log(`Admin: ${admin.email} / password: ${process.env.SEED_ADMIN_PASSWORD || 'password'}`);
process.exit(0);
