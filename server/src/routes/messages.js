import express from 'express';
import verifyToken from '../middlewares/verifyToken.js';

export function createMessageRoutes(messageController) {
  const router = express.Router();

  router.get('/partners', verifyToken, messageController.getPartners);
  router.get('/:otherUserId', verifyToken, messageController.getConversation);
  router.post('/', verifyToken, messageController.send);
  router.patch('/read/:otherUserId', verifyToken, messageController.markRead);

  return router;
}
