const jwt = require('jsonwebtoken');
const jwksRsa = require('jwks-rsa');
const { ManagementClient } = require('auth0');

class Auth0Strategy {
  constructor(config) {
    this.options = config;
    this.jwksClient = jwksRsa({
      jwksUri: `https://${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`,
      cache: true,
      rateLimit: true,
    });
  }

  get configuration() {
    const { auth0 } = this.options.oauth;
    return {
      ...auth0,
      header: 'Authorization',
      jwtOptions: {
        audience: process.env.AUTH0_AUDIENCE,
        issuer: `https://${process.env.AUTH0_DOMAIN}/`,
        algorithms: ['RS256'],
        ...auth0.jwtOptions,
      },
      schemes: ['Bearer'],
      service: 'users',
      whitelist: [],
    };
  }

  getSigningKey(kid) {
    return new Promise((resolve, reject) => {
      this.jwksClient.getSigningKey(kid, (err, key) => {
        if (err) {
          reject(err);
        } else {
          resolve(key.publicKey || key.rsaPublicKey);
        }
      });
    });
  }

  async authenticate(req, res, next) {
    if (!req.headers.authorization) {
      return res.status(401).send('No authorization header was found');
    }

    const accessToken = req.headers.authorization.split('Bearer ')[1];

    try {
      const decodedToken = jwt.decode(accessToken, { complete: true });
      if (!decodedToken) {
        throw new Error('Invalid token');
      }

      const { kid } = decodedToken.header;
      const signingKey = await this.getSigningKey(kid);

      const verified = jwt.verify(
        accessToken,
        signingKey,
        this.configuration.jwtOptions,
      );

      if (!verified) {
        throw new Error('Token could not be verified');
      }

      req.headers.currentUserId = verified.sub;
      req.user = {
        roles: verified['http://ledge.eu/roles'] || [],
        isAdmin: verified['http://ledge.eu/roles']?.includes('admin')
          ? 'true'
          : 'false',
        isBrand: verified['http://ledge.eu/roles']?.includes('brand')
          ? 'true'
          : 'false',
      };

      next();
    } catch (err) {
      console.log(err);
      return res.status(401).send('Token could not be verified');
    }
  }

  async deleteUser(userId) {
    const auth0 = new ManagementClient({
      domain: process.env.AUTH0_MANAGEMENT_DOMAIN,
      clientId: process.env.AUTH0_MANAGEMENT_CLIENT_ID,
      clientSecret: process.env.AUTH0_MANAGEMENT_CLIENT_SECRET,
      scope: 'delete:users',
    });

    try {
      await auth0.users.delete({ id: userId });
    } catch (error) {
      throw new Error(`Failed to delete user ${userId}:`, error);
    }
  }

  async changeEmail(userId, email) {
    const auth0 = new ManagementClient({
      domain: process.env.AUTH0_MANAGEMENT_DOMAIN,
      clientId: process.env.AUTH0_MANAGEMENT_CLIENT_ID,
      clientSecret: process.env.AUTH0_MANAGEMENT_CLIENT_SECRET,
      scope: 'read:users update:users',
    });
    try {
      const response = await auth0.updateUser({ id: userId }, { email, email_verified: false, verify_email: true });
    } catch (error) {
      throw new Error(`Failed to update email for user ${userId}:`, error);
    }
  }
}

module.exports = {
  Auth0Strategy,
};
