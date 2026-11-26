import express from 'express';
import cors from 'cors';
import { notFound, errorHandler } from './middlewares/errorHandler.js';
import { requestLogger } from './middlewares/requestLogger.js';

import { uploadthingHandler } from './uploadThing.js';
import { createGameService } from './services/gameService.js';
import { createGameController } from './controllers/gameController.js';
import { createGameRoutes } from './routes/games.js';

import { createAuthService } from './services/authService.js';
import { createAuthController } from './controllers/authController.js';
import { createAuthRoutes } from './routes/auth.js';

import { createVendorService } from './services/vendorService.js';
import { createVendorController } from './controllers/vendorController.js';
import { createVendorRoutes } from './routes/vendors.js';

import { createAccountService } from './services/accountService.js';
import { createAccountController } from './controllers/accountController.js';
import { createAccountRoutes } from './routes/accounts.js';

import { createEmailRoutes } from './routes/email.js';
import { createEmailService } from './services/emailService.js';
import { createOtpRepository } from './repositories/otpRepository.js';

import { createTransactionService } from './services/transactionService.js';
import { createTransactionController } from './controllers/transactionController.js';
import { createTransactionRoutes } from './routes/transactions.js';

import { createDashboardService } from './services/dashboardService.js';
import { createDashboardController } from './controllers/dashboardController.js';
import { createDashboardRoutes } from './routes/dashboard.js';

import { createPaymentService } from './services/paymentService.js';
import { createPaymentController } from './controllers/paymentController.js';
import { createPaymentRoutes } from './routes/payments.js';

import { createContactService } from './services/contactService.js';
import { createContactController } from './controllers/contactController.js';
import { createContactRoutes } from './routes/contacts.js';

import { createIdempotencyRepository } from './repositories/idempotencyRepository.js';
import { createIdempotencyMiddleware } from './middlewares/idempotency.js';

import { createMessageRepository } from './repositories/messageRepository.js';
import { createMessageService } from './services/messageService.js';
import { createMessageController } from './controllers/messageController.js';
import { createMessageRoutes } from './routes/messages.js';

import path from 'path';
import { fileURLToPath } from 'url';

export function createApp({
  pool,
  gameRepository,
  vendorRepository,
  accountRepository,
  otpRepository,
  emailController,
}) {
  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use(requestLogger);

  const gameService = createGameService(gameRepository);
  const gameController = createGameController(gameService);

  const vendorService = createVendorService(vendorRepository);
  const vendorController = createVendorController(vendorService);

  const emailService = createEmailService();
  const authService = createAuthService(accountRepository, otpRepository, emailService);
  const authController = createAuthController(authService);
  const authRoutes = createAuthRoutes(authController);

  const accountService = createAccountService(accountRepository);
  const accountController = createAccountController(accountService);
  const accountRoutes = createAccountRoutes(accountController);

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const clientDistPath = path.resolve(__dirname, '../../client/dist');

  const transactionService = createTransactionService(pool);
  const transactionController = createTransactionController(transactionService);
  const transactionRoutes = createTransactionRoutes(transactionController);

  const dashboardService = createDashboardService(pool);
  const dashboardController = createDashboardController(dashboardService);
  const dashboardRoutes = createDashboardRoutes(dashboardController);

  const idempotencyRepository = createIdempotencyRepository(pool);
  const idempotencyMiddleware = createIdempotencyMiddleware(idempotencyRepository);

  const paymentService = createPaymentService(pool);
  const paymentController = createPaymentController(paymentService);
  const paymentRoutes = createPaymentRoutes(paymentController);

  const contactService = createContactService(pool, emailService);
  const contactController = createContactController(contactService);
  app.use('/api/contact', createContactRoutes(contactController));

  const messageRepository = createMessageRepository(pool);
  const messageService = createMessageService(messageRepository);
  const messageController = createMessageController(messageService);
  app.use('/api/messages', createMessageRoutes(messageController));

  app.use('/api/uploadthing', uploadthingHandler);
  app.use(express.static(clientDistPath));

  app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

  app.use('/api/games', createGameRoutes(gameController));
  app.use('/api/vendors', createVendorRoutes(vendorController));
  app.use('/api/auth', authRoutes);
  app.use('/api/accounts', accountRoutes);
  app.use('/api/transactions', transactionRoutes);
  app.use('/api/payments', paymentRoutes);
  app.use('/api/dashboard', dashboardRoutes);

  if (emailController) {
    app.use('/api/emails', createEmailRoutes(emailController));
  }
  app.get(/^\/(?!api|socket\.io).*/, (req, res) => {
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });

  app.use(notFound);
  app.use((err, req, res, next) => {
    const statusCode = err.statusCode || err.status || 500;
    console.error(`[Error]: ${err.message}`);
    res.status(statusCode).json({
      success: false,
      message: statusCode === 500 ? 'Internal Server Error' : err.message,
    });
  });

  return app;
}
