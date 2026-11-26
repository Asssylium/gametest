import express from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import verifyToken from '../middlewares/verifyToken.js';
import requireAdmin from '../middlewares/requireAdmin.js';

export function createVendorRoutes(controller) {
  const router = express.Router();

  router.get('/', verifyToken, asyncHandler(controller.getAll));
  router.get('/:id', verifyToken, asyncHandler(controller.getById));
  router.get('/:id/games', verifyToken, asyncHandler(controller.getGames));

  router.post('/', verifyToken, requireAdmin, asyncHandler(controller.create));
  router.put('/:id', verifyToken, requireAdmin, asyncHandler(controller.update));
  router.delete('/:id', verifyToken, requireAdmin, asyncHandler(controller.remove)); // Lưu ý: dùng controller.remove

  return router;
}
