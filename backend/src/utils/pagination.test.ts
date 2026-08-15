import assert from 'node:assert/strict';
import test from 'node:test';
import { getPagination } from './pagination.ts';

test('normalizes pagination and clamps a page beyond the last page', () => {
  assert.deepEqual(getPagination({ page: '3', limit: '24' }, 61), {
    page: 3,
    limit: 24,
    pages: 3,
    skip: 48,
  });

  assert.deepEqual(getPagination({ page: '99', limit: '500' }, 61), {
    page: 2,
    limit: 60,
    pages: 2,
    skip: 60,
  });
});
