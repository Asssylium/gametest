import { createApp } from './app.js';
import { connectMongo } from './db/mongoDatabase.js';
import { createMongoGameRepository } from './repositories/mongoGameRepository.js';
import {
  createMongoVendorRepository,
  createMongoAccountRepository,
  createMongoOtpRepository,
  createMongoEmailRepository,
} from './repositories/mongoRepositories.js';
import { createEmailController } from './controllers/emailController.js';
import { createEmailService } from './services/emailService.js';
import { runScheduledEmails } from './jobs/emailCron.js';

export function createLazyHandler(initialize) {
  let appPromise;
  return async (request, response) => {
    if (!appPromise) {
      appPromise = initialize().catch((error) => {
        appPromise = undefined;
        throw error;
      });
    }
    try {
      const app = await appPromise;
      return app(request, response);
    } catch (error) {
      console.error('Server initialization failed:', error.name);
      response.statusCode = 503;
      response.end('Service unavailable');
    }
  };
}

export const handler = createLazyHandler(async () => {
  const { db, client } = await connectMongo(process.env.MONGODB_URI, process.env.MONGODB_DATABASE || 'mentor_game');
  const emailRepository = createMongoEmailRepository(db);
  return createApp({
    db,
    mongoClient: client,
    gameRepository: createMongoGameRepository(db),
    vendorRepository: createMongoVendorRepository(db),
    accountRepository: createMongoAccountRepository(db),
    otpRepository: createMongoOtpRepository(db),
    emailController: createEmailController(emailRepository),
    runEmailJob: () => runScheduledEmails(emailRepository, db, createEmailService()),
  });
});