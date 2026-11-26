import express from 'express';
import verifyToken from '../middlewares/verifyToken.js';
import requireAdmin from '../middlewares/requireAdmin.js';

export function createDashboardRoutes(dashboardController) {
  const router = express.Router();

  router.get('/stats', verifyToken, requireAdmin, dashboardController.getStats);

  return router;
}
