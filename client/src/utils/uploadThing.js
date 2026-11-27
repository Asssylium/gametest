import { generateUploadButton, generateUploadDropzone, generateReactHelpers } from '@uploadthing/react';

const uploadUrl = `${window.location.origin}/api/uploadthing`;

export const UploadButton = generateUploadButton({
  url: uploadUrl,
});

export const UploadDropzone = generateUploadDropzone({
  url: uploadUrl,
});

export const { uploadFiles } = generateReactHelpers({
  url: uploadUrl,
});
