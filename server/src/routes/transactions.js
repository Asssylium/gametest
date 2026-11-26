import express from 'express';
import verifyToken from '../middlewares/verifyToken.js';
import requireAdmin from '../middlewares/requireAdmin.js';

export function createTransactionRoutes(transactionController, idempotencyMiddleware) {
  const router = express.Router();

  const guard = idempotencyMiddleware || ((req, res, next) => next());

  router.post('/deposit', verifyToken, requireAdmin, guard, transactionController.deposit);
  router.post('/withdraw', verifyToken, requireAdmin, guard, transactionController.withdraw);

  router.get('/my', verifyToken, transactionController.getMyHistory);
  router.get('/:accountId', verifyToken, requireAdmin, transactionController.getHistory);

  return router;
}
