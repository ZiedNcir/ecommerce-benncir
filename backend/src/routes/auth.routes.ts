import { Router } from 'express';
import { createAdmin, login, me, register, setupFirstAdmin } from '../controllers/auth.controller.ts';
import { adminOnly, protect } from '../middlewares/auth.middleware.ts';
import asyncHandler from '../middlewares/asyncHandler.ts';

const router = Router();
router.post('/register', asyncHandler(register));
router.post('/login', asyncHandler(login));
router.get('/me', protect, asyncHandler(me));
router.post('/setup-admin', asyncHandler(setupFirstAdmin));
router.post('/admin', protect, adminOnly, asyncHandler(createAdmin));
export default router;
