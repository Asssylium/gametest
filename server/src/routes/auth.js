import express from 'express';
import authenticateToken from '../middlewares/verifyToken.js';

export function createAuthRoutes(authController) {
  const router = express.Router();

  router.post('/verify-email', authController.verifyEmail);

  router.post('/register', authController.register);
  router.post('/login', authController.login);
  router.post('/logout', authController.logout);
  router.post('/change-password', authenticateToken, authController.changePassword);

  router.get('/profile', authenticateToken, authController.getProfile);
  router.put('/profile', authenticateToken, authController.updateProfile);

  router.post('/google', authController.googleLogin);
  router.post('/google-register', authController.googleRegister);

  return router;
}
