import { ingcoCategoryMap } from '../data/ingcoCategoryMap.ts';
import type { CatalogueSourceRules } from './catalogueImport.utils.ts';

export type ImportProfile = CatalogueSourceRules & {
  key: 'ingco' | 'technotools' | 'dyllu';
  label: string;
  inputEnv: string;
  defaultInput: string;
  dryRunEnv: string;
  allowIncompleteEnv: string;
  categoryMap: Record<string, string>;
};

const commonCategoryMap: Record<string, string> = {
  ...ingcoCategoryMap,
  accessoires: 'accessoires', batterie: 'batteries-chargeurs', chargeur: 'batteries-chargeurs',
  cle: 'cles', 'cle-a-choc': 'cles', disque: 'meules-disques', foret: 'meches-forets',
  jardinage: 'outils-agricoles', 'meule-a-disque': 'meuleuses', 'meuleuse-d-angle': 'meuleuses',
  outillage: 'outils-de-bricolage', 'outillage-a-main': 'outillage-a-main',
  'outillage-eclectique': 'outils-electriques-sans-fil',
  'outillage-electrique': 'outils-electriques-sans-fil', 'outillage-sans-fil': 'outils-sans-fil',
  'outils-de-jardin': 'outils-agricoles', 'perceuse-a-percussion': 'perceuses',
  plomberie: 'plomberie', pompe: 'pompes-a-eau', soudure: 'soudure', souffleur: 'souffleurs',
  tournevis: 'tournevis', visseuse: 'visseuses',
};

export const importProfiles: Record<ImportProfile['key'], ImportProfile> = {
  ingco: {
    key: 'ingco', label: 'INGCO', inputEnv: 'INGCO_IMPORT_FILE', defaultInput: 'data/ingco-products.json',
    dryRunEnv: 'INGCO_IMPORT_DRY_RUN', allowIncompleteEnv: 'INGCO_IMPORT_ALLOW_INCOMPLETE',
    defaultBrand: 'INGCO', defaultSourceName: 'ingco.tn', allowedBrands: ['INGCO'],
    allowedHosts: ['ingco.tn', 'www.ingco.tn'], categoryMap: commonCategoryMap,
  },
  technotools: {
    key: 'technotools', label: 'INGCO TechnoTools', inputEnv: 'TECHNOTOOLS_IMPORT_FILE',
    defaultInput: 'data/technotools-products.json', dryRunEnv: 'TECHNOTOOLS_IMPORT_DRY_RUN',
    allowIncompleteEnv: 'TECHNOTOOLS_IMPORT_ALLOW_INCOMPLETE', defaultBrand: 'INGCO',
    defaultSourceName: 'technotools.tn', allowedBrands: ['INGCO'],
    allowedHosts: ['technotools.tn', 'www.technotools.tn'], categoryMap: commonCategoryMap,
  },
  dyllu: {
    key: 'dyllu', label: 'DYLLU TechnoTools', inputEnv: 'DYLLU_IMPORT_FILE',
    defaultInput: 'data/technotools-dyllu-products.json', dryRunEnv: 'DYLLU_IMPORT_DRY_RUN',
    allowIncompleteEnv: 'DYLLU_IMPORT_ALLOW_INCOMPLETE', defaultBrand: 'DYLLU',
    defaultSourceName: 'technotools.tn', allowedBrands: ['DYLLU'],
    allowedHosts: ['technotools.tn', 'www.technotools.tn'], categoryMap: commonCategoryMap,
  },
};

export function getImportProfile(value: string): ImportProfile {
  const profile = importProfiles[value as ImportProfile['key']];
  if (!profile) throw new Error(`Profil inconnu "${value}". Profils: ${Object.keys(importProfiles).join(', ')}`);
  return profile;
}
