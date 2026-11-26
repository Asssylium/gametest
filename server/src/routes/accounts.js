// server/src/routes/accounts.js
import express from 'express';
import verifyToken from '../middlewares/verifyToken.js';
import requireAdmin from '../middlewares/requireAdmin.js';

export function createAccountRoutes(controller) {
  const router = express.Router();

  router.use(verifyToken, requireAdmin);

  router.get('/', controller.getList);
  router.patch('/:id/role', controller.updateRole);
  router.patch('/:id/status', controller.updateStatus);

  return router;
}
