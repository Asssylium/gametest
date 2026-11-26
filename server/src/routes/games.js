import express from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { validateGame } from '../middlewares/validateGame.js';

export function createGameRoutes(controller) {
  const router = express.Router();

  router.get('/stats', asyncHandler(controller.stats));
  router.get('/', asyncHandler(controller.getAll));
  router.patch('/bulk', asyncHandler(controller.bulkUpdate));
  router.post('/', validateGame, asyncHandler(controller.create));

  router.get('/:id', asyncHandler(controller.getById));
  router.put('/:id', validateGame, asyncHandler(controller.update));
  router.patch('/:id', asyncHandler(controller.update));
  router.delete('/:id', asyncHandler(controller.remove));

  return router;
}
