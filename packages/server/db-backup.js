const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const { S3Client, PutObjectCommand, ListObjectsV2Command, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { logger } = require('./src/logger');
require('dotenv').config();

const s3Client = new S3Client({
  region: 'eu-central-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const BUCKET_NAME = 'ledge-media';
const S3_BACKUP_PREFIX = 'dbBackup/';

async function executeDbBackup() {

  if (process.env.NODE_ENV === 'development') {
    logger.info('Skipping backup in development environment');
    return;
  }

  const date = new Date();
  const dateString = `${date.getFullYear()}-${('0' + (date.getMonth() + 1)).slice(-2)}-${('0' + date.getDate()).slice(-2)}_${('0' + date.getHours()).slice(-2)}-${('0' + date.getMinutes()).slice(-2)}-${('0' + date.getSeconds()).slice(-2)}`;
  const backupPath = path.join('/tmp', 'dbBackup', dateString);
  const backupFile = `${backupPath}.archive.gz`;

  // Ensure backup directory exists
  fs.mkdirSync(backupPath, { recursive: true });

  // Validate backup file path to prevent command injection
  if (!backupFile.match(/^[/\w.-]+$/)) {
    logger.error('Invalid backup file path');
    return;
  }

  const command = `mongodump --uri "${process.env.DATABASE_URL}" --archive="${backupFile}" --gzip`;
  exec(command, async (error) => {
    if (error) {
      logger.error(`Backup failed: ${error.message}`);
      return;
    }

    // Upload to S3
    const s3Path = `${S3_BACKUP_PREFIX}${path.basename(backupFile)}`;
    try {
      const fileStream = fs.createReadStream(backupFile);
      const uploadParams = {
        Bucket: BUCKET_NAME,
        Key: s3Path,
        Body: fileStream,
      };
      const command = new PutObjectCommand(uploadParams);
      await s3Client.send(command);
      logger.info(`Backup successfully uploaded to S3: ${s3Path}`);

      await cleanupOldBackups();

      // Cleanup local file after upload
      fs.unlinkSync(backupFile);
    } catch (err) {
      logger.error(`Failed to upload backup to S3: ${err.message}`);
    }
  });
}

// Function to delete backups older than 7 days from S3
async function cleanupOldBackups() {
  try {
    const listParams = {
      Bucket: BUCKET_NAME,
      Prefix: S3_BACKUP_PREFIX,
    };
    const listCommand = new ListObjectsV2Command(listParams);
    const { Contents } = await s3Client.send(listCommand);

    if (!Contents) {
      logger.info('No backups found in S3');
      return;
    }

    const now = new Date();
    const fiveDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    for (const object of Contents) {
      if (object.LastModified < fiveDaysAgo) {
        const deleteParams = {
          Bucket: BUCKET_NAME,
          Key: object.Key,
        };
        const deleteCommand = new DeleteObjectCommand(deleteParams);
        await s3Client.send(deleteCommand);
        logger.info(`Deleted old backup: ${object.Key}`);
      }
    }
  } catch (error) {
    logger.error(`Failed to cleanup old backups: ${error.message}`);
  }
}

module.exports = { executeDbBackup };
