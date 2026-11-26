import http from 'node:http';
import 'dotenv/config';
import { createApp } from './src/app.js';
import { config } from './src/config.js';
import { createPool } from './src/db/database.js';
import { initSocket } from './src/socket.js';

import { createGameRepository } from './src/repositories/gameRepository.js';
import { createVendorRepository } from './src/repositories/vendorRepository.js';
import { createAccountRepository } from './src/repositories/accountRepository.js';
import { createOtpRepository } from './src/repositories/otpRepository.js';
import { createEmailRepository } from './src/repositories/emailRepository.js';

import { createEmailController } from './src/controllers/emailController.js';
import { createEmailService } from './src/services/emailService.js';
import { startEmailCronJob } from './src/jobs/emailCron.js';

const pool = createPool();

const gameRepository = createGameRepository({ pool });
const vendorRepository = createVendorRepository({ pool });
const accountRepository = createAccountRepository(pool);
const otpRepository = createOtpRepository(pool);

const emailService = createEmailService();
const emailRepo = createEmailRepository(pool);
const emailController = createEmailController(emailRepo);

const app = createApp({
  pool,
  gameRepository,
  vendorRepository,
  accountRepository,
  otpRepository,
  emailController,
});

const httpServer = http.createServer(app);
const io = initSocket(httpServer, { jwtSecret: process.env.JWT_SECRET });
app.set('io', io);

startEmailCronJob(emailRepo, pool, emailService);
console.log('🚀 Email Cron Job đã được kích hoạt!');

const PORT = process.env.PORT || 3000;
const APP_NAME = process.env.APP_NAME || 'Games API';

httpServer.listen(PORT, () => {
  console.log(`${APP_NAME} chạy ở cổng ${PORT}`);
  console.log(`(db: ${config.db.database}@${config.db.host})`);
});
