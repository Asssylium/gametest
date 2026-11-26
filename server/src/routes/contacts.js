import express from 'express';
import verifyToken from '../middlewares/verifyToken.js';
import requireAdmin from '../middlewares/requireAdmin.js';

export function createContactRoutes(contactController) {
  const router = express.Router();

  router.get('/info', verifyToken, contactController.getInfo);
  router.put('/info', verifyToken, requireAdmin, contactController.updateInfo);
  router.post('/send', verifyToken, contactController.sendContact);

  router.get('/messages', verifyToken, requireAdmin, contactController.getMessages);
  router.patch('/messages/:id/read', verifyToken, requireAdmin, contactController.markRead);
  router.post('/messages/:id/reply', verifyToken, requireAdmin, contactController.replyMessage);

  return router;
}
