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

import { createMongoTransactionService, createMongoPaymentService } from './services/mongoWalletService.js';
import { createTransactionController } from './controllers/transactionController.js';
import { createTransactionRoutes } from './routes/transactions.js';

import { createMongoDashboardService } from './services/mongoDashboardService.js';
import { createDashboardController } from './controllers/dashboardController.js';
import { createDashboardRoutes } from './routes/dashboard.js';

import { createPaymentController } from './controllers/paymentController.js';
import { createPaymentRoutes } from './routes/payments.js';

import { createMongoContactService } from './services/mongoContactService.js';
import { createContactController } from './controllers/contactController.js';
import { createContactRoutes } from './routes/contacts.js';

import { createMongoMessageRepository } from './repositories/mongoRepositories.js';

import { createMessageService } from './services/messageService.js';
import { createMessageController } from './controllers/messageController.js';
import { createMessageRoutes } from './routes/messages.js';

import path from 'path';
import { fileURLToPath } from 'url';

export function createApp({
  db,
  mongoClient,
  gameRepository,
  vendorRepository,
  accountRepository,
  otpRepository,
  emailController,
  runEmailJob,
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

  const transactionService = createMongoTransactionService(db, mongoClient);
  const transactionController = createTransactionController(transactionService);
  const transactionRoutes = createTransactionRoutes(transactionController);

  const dashboardService = createMongoDashboardService(db);
  const dashboardController = createDashboardController(dashboardService);
  const dashboardRoutes = createDashboardRoutes(dashboardController);

  const paymentService = createMongoPaymentService(db, mongoClient);
  const paymentController = createPaymentController(paymentService);
  const paymentRoutes = createPaymentRoutes(paymentController);

  const contactService = createMongoContactService(db, emailService);
  const contactController = createContactController(contactService);
  app.use('/api/contact', createContactRoutes(contactController));

  const messageRepository = createMongoMessageRepository(db);
  const messageService = createMessageService(messageRepository);
  const messageController = createMessageController(messageService);
  app.use('/api/messages', createMessageRoutes(messageController));

  app.use('/api/uploadthing', uploadthingHandler);
  app.use(express.static(clientDistPath));

  app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

  if (runEmailJob) {
    app.get('/api/cron/email', async (req, res, next) => {
      if (!process.env.CRON_SECRET || req.get('Authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      try {
        await runEmailJob();
        return res.json({ status: 'ok' });
      } catch (error) {
        return next(error);
      }
    });
  }

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
