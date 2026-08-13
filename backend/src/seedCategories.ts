import dotenv from 'dotenv';
import connectDB from './config/db.ts';
import Category from './models/Category.ts';
import { catalogCategories } from './data/catalogCategories.ts';

dotenv.config();
await connectDB();

let rootCount = 0;
let childCount = 0;

for (const rootData of catalogCategories) {
  const { children, ...rootFields } = rootData;
  const root = await Category.findOneAndUpdate(
    { slug: rootFields.slug },
    { $set: { ...rootFields, parent: null, isActive: true } },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );
  rootCount += 1;

  for (let index = 0; index < children.length; index += 1) {
    const [name, slug] = children[index];
    await Category.findOneAndUpdate(
      { slug },
      {
        $set: {
          name,
          slug,
          description: `${name} : sélection spécialisée pour professionnels et bricoleurs.`,
          parent: root._id,
          sortOrder: (index + 1) * 10,
          isActive: true,
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );
    childCount += 1;
  }
}

console.log(`Catalogue catégories synchronisé : ${rootCount} catégories principales et ${childCount} sous-catégories.`);
process.exit(0);
