import { Router } from 'express';
import { createUser, deleteUser, getUsers, updateUser, updateUserRole } from '../controllers/user.controller.ts';
import { adminOnly, protect } from '../middlewares/auth.middleware.ts';
import asyncHandler from '../middlewares/asyncHandler.ts';

const router = Router();
router.get('/', protect, adminOnly, asyncHandler(getUsers));
router.post('/', protect, adminOnly, asyncHandler(createUser));
router.put('/:id', protect, adminOnly, asyncHandler(updateUser));
router.patch('/:id/role', protect, adminOnly, asyncHandler(updateUserRole));
router.delete('/:id', protect, adminOnly, asyncHandler(deleteUser));
export default router;
