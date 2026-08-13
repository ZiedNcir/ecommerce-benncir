import { Router } from 'express';
import { createProduct, deleteProduct, getProductById, getProducts, updateProduct } from '../controllers/product.controller.ts';
import { adminOnly, protect } from '../middlewares/auth.middleware.ts';
import asyncHandler from '../middlewares/asyncHandler.ts';

const router = Router();
router.get('/', asyncHandler(getProducts));
router.get('/:id', asyncHandler(getProductById));
router.post('/', protect, adminOnly, asyncHandler(createProduct));
router.put('/:id', protect, adminOnly, asyncHandler(updateProduct));
router.delete('/:id', protect, adminOnly, asyncHandler(deleteProduct));
export default router;
