import { Router } from 'express';
import {
  createContactMessage,
  deleteContactMessage,
  getContactMessageById,
  getContactMessages,
  updateContactMessage,
} from '../controllers/contact.controller.ts';
import { adminOnly, protect } from '../middlewares/auth.middleware.ts';
import asyncHandler from '../middlewares/asyncHandler.ts';

const router = Router();
router.post('/', asyncHandler(createContactMessage));
router.get('/', protect, adminOnly, asyncHandler(getContactMessages));
router.get('/:id', protect, adminOnly, asyncHandler(getContactMessageById));
router.patch('/:id', protect, adminOnly, asyncHandler(updateContactMessage));
router.delete('/:id', protect, adminOnly, asyncHandler(deleteContactMessage));

export default router;
