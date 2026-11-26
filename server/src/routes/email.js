import express from 'express';
import verifyToken from '../middlewares/verifyToken.js';

export function createEmailRoutes(emailController) {
  const router = express.Router();

  router.post('/schedule', verifyToken, emailController.scheduleEmail);

  return router;
}
