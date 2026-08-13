export const catalogCategories = [
  {
    name: 'Outils électriques & sans fil',
    slug: 'outils-electriques-sans-fil',
    description: 'Perçage, vissage, meulage, soufflage et solutions sur batterie.',
    image: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=1200&q=80',
    sortOrder: 10,
    children: [
      ['Perceuses', 'perceuses'], ['Visseuses', 'visseuses'], ['Meuleuses', 'meuleuses'],
      ['Souffleurs', 'souffleurs'], ['Outils sans fil', 'outils-sans-fil'],
      ['Batteries et chargeurs', 'batteries-chargeurs'],
    ],
  },
  {
    name: 'Outillage à main', slug: 'outillage-a-main',
    description: 'Les outils essentiels pour le chantier, l’atelier et le bricolage.',
    image: 'https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?auto=format&fit=crop&w=1200&q=80', sortOrder: 20,
    children: [['Marteaux', 'marteaux'], ['Clés', 'cles'], ['Pinces', 'pinces'], ['Tournevis', 'tournevis'], ['Outils de mesure', 'outils-de-mesure']],
  },
  {
    name: 'Accessoires & consommables', slug: 'accessoires-consommables',
    description: 'Forets, mèches, disques, meules et accessoires complémentaires.',
    image: 'https://images.unsplash.com/photo-1530124566582-a618bc2615dc?auto=format&fit=crop&w=1200&q=80', sortOrder: 30,
    children: [['Mèches et forets', 'meches-forets'], ['Meules et disques', 'meules-disques'], ['Accessoires', 'accessoires']],
  },
  {
    name: 'Atelier, soudure & pneumatique', slug: 'atelier-soudure-pneumatique',
    description: 'Équipements d’atelier, soudure et solutions pneumatiques.',
    image: 'https://images.unsplash.com/photo-1581783898377-1c85bf937427?auto=format&fit=crop&w=1200&q=80', sortOrder: 40,
    children: [['Soudure', 'soudure'], ['Pneumatique', 'pneumatique'], ['Caisses à outils', 'caisses-a-outils'], ['Outils de bricolage', 'outils-de-bricolage']],
  },
  {
    name: 'Plomberie & pompage', slug: 'plomberie-pompage',
    description: 'Outillage de plomberie, pompes à eau et accessoires associés.',
    image: 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&w=1200&q=80', sortOrder: 50,
    children: [['Plomberie', 'plomberie'], ['Pompes à eau', 'pompes-a-eau']],
  },
  {
    name: 'Menuiserie & peinture', slug: 'menuiserie-peinture',
    description: 'Solutions pour la découpe, la finition, la peinture et l’aménagement.',
    image: 'https://images.unsplash.com/photo-1601058268499-e52658b8bb88?auto=format&fit=crop&w=1200&q=80', sortOrder: 60,
    children: [['Menuiserie', 'menuiserie'], ['Peinture', 'peinture']],
  },
  {
    name: 'Jardin & agriculture', slug: 'jardin-agriculture',
    description: 'Équipements pour l’entretien des espaces verts et les travaux agricoles.',
    image: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=1200&q=80', sortOrder: 70,
    children: [['Outils agricoles', 'outils-agricoles']],
  },
  {
    name: 'Packs & rangement', slug: 'packs-rangement',
    description: 'Packs prêts à l’emploi et solutions pratiques de rangement.',
    image: 'https://images.unsplash.com/photo-1540103711724-ebf833bde8d1?auto=format&fit=crop&w=1200&q=80', sortOrder: 80,
    children: [['Packs', 'packs'], ['Rangement et transport', 'rangement-transport']],
  },
];
