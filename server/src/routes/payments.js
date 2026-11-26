import express from 'express';
import verifyToken from '../middlewares/verifyToken.js';

export function createPaymentRoutes(paymentController, idempotencyMiddleware) {
  const router = express.Router();

  const guard = idempotencyMiddleware || ((req, res, next) => next());

  router.post('/create-qr', verifyToken, guard, paymentController.createQR);
  router.get('/status/:orderCode', verifyToken, paymentController.checkStatus);

  router.post('/webhook', paymentController.webhook);

  return router;
}
