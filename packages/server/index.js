const app = require('./src/app');
const { logger } = require('./src/logger');

const port = process.env.PORT || 3030;
const host = process.env.HOST || 'localhost';

// Start endpoints
app.listen(port, '0.0.0.0', () => {
  logger.info(`Express app listening on http://${host}:${port}`);
});