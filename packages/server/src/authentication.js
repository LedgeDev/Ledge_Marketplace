const { Auth0Strategy } = require('./auth/auth0Strategy');
const config = require('config');
const express = require('express');

// Instantiate the class Auth0Strategy
const strategy = new Auth0Strategy(config.get('authentication'));

// Create a middleware to handle large payloads before authentication
const handleLargePayloads = express.json({ limit: '50mb' });

const authenticate = async (req, res, next) => {
  // If the request body hasn't been parsed yet (due to size), parse it first
  if (!req.body && req.headers['content-type'] && req.headers['content-type'].includes('application/json')) {
    return handleLargePayloads(req, res, () => authenticate(req, res, next));
  }

  if (process.env.INTEGRATION_TEST_MODE === 'true') {
    // Bypass authentication in test mode, and set admin to user
    req.user = { isAdmin: "true" };
    req.headers.currentUserId = "664a28c6ab587d72477e8b96";
    req.headers.email = "test@test.com";
    return next();
  }

  await strategy.authenticate(req, res, next);
};

const deleteUser = async (userId) => {
  await strategy.deleteUser(userId);
};

const changeEmail = async (userId, email) => {
  await strategy.changeEmail(userId, email);
};

module.exports = { authenticate, deleteUser, changeEmail };

