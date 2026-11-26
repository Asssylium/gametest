import { generateUploadButton, generateUploadDropzone, generateReactHelpers } from '@uploadthing/react';

export const UploadButton = generateUploadButton({
  url: 'http://localhost:3001/api/uploadthing',
});

export const UploadDropzone = generateUploadDropzone({
  url: 'http://localhost:3001/api/uploadthing',
});

export const { uploadFiles } = generateReactHelpers({
  url: 'http://localhost:3001/api/uploadthing',
});
