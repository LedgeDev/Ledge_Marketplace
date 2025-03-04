const {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const crypto = require('crypto');
const { promisify } = require('util');
require('dotenv').config();

const randomBytes = promisify(crypto.randomBytes);

const region = 'eu-central-1';
const bucketName = 'ledge-media';
const bucketFolder = process.env.INTEGRATION_TEST_MODE === 'true' ? 'testing/' : '';
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

const s3Client = new S3Client({
  region,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

const generateUploadURL = async (ext) => {
  const rawBytes = await randomBytes(16);
  const fileName = rawBytes.toString('hex');
  const fileNameWithExt = `${bucketFolder}${fileName}.${ext}`;

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: fileNameWithExt,
  });

  const uploadURL = await getSignedUrl(s3Client, command, { expiresIn: 60 });
  return uploadURL;
};

const generateUpdateURL = async (fileNameWithExt) => {
  const fullPath = `${bucketFolder}${fileNameWithExt}`;
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: fullPath,
  });

  const updateURL = await getSignedUrl(s3Client, command, { expiresIn: 60 });
  return updateURL;
};

const generateDeleteURL = async (fileNameWithExt) => {
  const fullPath = `${bucketFolder}${fileNameWithExt}`;
  const command = new DeleteObjectCommand({
    Bucket: bucketName,
    Key: fullPath,
  });

  const deleteURL = await getSignedUrl(s3Client, command, { expiresIn: 60 });
  return deleteURL;
};

module.exports = {
  generateUploadURL,
  generateUpdateURL,
  generateDeleteURL,
};
