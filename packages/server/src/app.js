if(process.env.INTEGRATION_TEST_MODE === 'true') {
  require('dotenv').config({ path: `.env.test` });
} else {
  require('dotenv').config();
}

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const mongodb = require('./mongodb');
const services = require('./services/index');

const app = express();

app.use('/deal-codes/shopify-webhook', express.raw({type: 'application/json'}));

// Body Parser Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// CORS Middleware
app.use(cors());

// MongoDB Initialization
mongodb(app);

// Initialize services
services.forEach(service => app.use(service.path, service.router));

app.get('/', (req, res) => {
  res.send('Welcome to the ledge Api :)');
});

// Export the app
module.exports = app;
