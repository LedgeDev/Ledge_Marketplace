const { generateUploadURL } = require('../services/s3/utils');
const { postImageToS3 } = require('./postImageToS3');
const sharp = require('sharp');

const uploadFile = async (fileObject) => {
  // Check if fileObject or its _data property is missing
  if (!fileObject || !fileObject._data) {
    return null;
  }

  // Extract file properties from React Native blob
  const file = {
    type: fileObject._data.type,
    name: fileObject._data.name,
    size: fileObject._data.size,
    blob: fileObject // Keep the original blob
  };

  const extension = file.name.split('.').pop();

  // Step 1: Upload the original image
  const originalFormData = new FormData();
  originalFormData.append('file', file.blob);
  const originalUrl = await generateUploadURL(extension);
  const s3FileUrlOriginal = await postImageToS3(originalFormData, originalUrl);

  // Step 2: Resize the image to 1200x1200 for "high" quality
  // Convert the blob to a buffer for sharp to process
  const blobBuffer = Buffer.from(fileObject._data.blob, 'binary');
  const resizedBuffer = await sharp(blobBuffer)
    .resize(1200, 1200, {
      fit: 'inside', // Maintain aspect ratio, fit within 1200x1200
      withoutEnlargement: true // Don’t upscale if smaller than 1200x1200
    })
    .toBuffer();

  // Step 3: Upload the resized "high" quality image
  const highFormData = new FormData();
  highFormData.append('file', resizedBuffer, { filename: `high.${extension}`, contentType: file.type });
  const highUrl = await generateUploadURL(extension);
  const s3FileUrlHigh = await postImageToS3(highFormData, highUrl);

  // Step 4: Return both URLs
  return {
    original: s3FileUrlOriginal,
    high: s3FileUrlHigh
  };
};

module.exports = { uploadFile };
