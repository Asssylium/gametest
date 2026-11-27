import http from 'node:http';
import 'dotenv/config';
import './src/config.js';
import { createApp } from './src/app.js';
import { connectMongo, seedMongoCatalog } from './src/db/mongoDatabase.js';
import { initSocket } from './src/socket.js';

import { createMongoGameRepository } from './src/repositories/mongoGameRepository.js';
import {
  createMongoVendorRepository,
  createMongoAccountRepository,
  createMongoOtpRepository,
  createMongoEmailRepository,
} from './src/repositories/mongoRepositories.js';

import { createEmailController } from './src/controllers/emailController.js';
import { createEmailService } from './src/services/emailService.js';
import { startEmailCronJob } from './src/jobs/emailCron.js';

const databaseName = process.env.MONGODB_DATABASE || 'mentor_game';
const { client: mongoClient, db } = await connectMongo(process.env.MONGODB_URI, databaseName);
await seedMongoCatalog(db);

const gameRepository = createMongoGameRepository(db);
const vendorRepository = createMongoVendorRepository(db);
const accountRepository = createMongoAccountRepository(db);
const otpRepository = createMongoOtpRepository(db);

const emailService = createEmailService();
const emailRepo = createMongoEmailRepository(db);
const emailController = createEmailController(emailRepo);

const app = createApp({
  db,
  mongoClient,
  gameRepository,
  vendorRepository,
  accountRepository,
  otpRepository,
  emailController,
});

const httpServer = http.createServer(app);
const io = initSocket(httpServer, { jwtSecret: process.env.JWT_SECRET });
app.set('io', io);

startEmailCronJob(emailRepo, db, emailService);
console.log('🚀 Email Cron Job đã được kích hoạt!');

const PORT = process.env.PORT || 3001;
const APP_NAME = process.env.APP_NAME || 'Games API';

httpServer.listen(PORT, () => {
  console.log(`${APP_NAME} chạy ở cổng ${PORT}`);
  console.log(`(MongoDB database: ${databaseName})`);
});
