const { Auth0Strategy } = require('./auth/auth0Strategy');
const config = require('config');

// Instantiate the class Auth0Strategy
const strategy = new Auth0Strategy(config.get('authentication'));

const authenticate = async (req, res, next) => {
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

