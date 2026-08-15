import assert from 'node:assert/strict';
import test from 'node:test';
import { buildCategoryDeactivationUpdate, buildProductDeactivationUpdate } from './catalogLifecycle.ts';

test('product deactivation hides the product from every public surface', () => {
  assert.deepEqual(buildProductDeactivationUpdate(), {
    isActive: false,
    visibleOnSite: false,
    visibleInSearch: false,
    publicationStatus: 'hidden',
  });
});

test('category deactivation preserves the document while disabling it', () => {
  assert.deepEqual(buildCategoryDeactivationUpdate(), { isActive: false });
});
