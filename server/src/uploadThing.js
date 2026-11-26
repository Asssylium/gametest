import dotenv from 'dotenv';
dotenv.config();

import { createUploadthing, createRouteHandler } from 'uploadthing/express';

const f = createUploadthing();

export const uploadRouter = {
  avatarUploader: f({ image: { maxFileSize: '4MB', maxFileCount: 1 } }).onUploadComplete(async ({ metadata, file }) => {
    console.log('Upload hoàn tất!');
    console.log('Đường dẫn file (URL):', file.url);
  }),
  gameImageUploader: f({ image: { maxFileSize: '4MB', maxFileCount: 1 } }).onUploadComplete(
    async ({ metadata, file }) => {
      console.log('Game Image upload hoàn tất. URL:', file.url);
    }
  ),
};

export const uploadthingHandler = createRouteHandler({
  router: uploadRouter,
  config: {
    token: process.env.UPLOADTHING_TOKEN,
  },
});
