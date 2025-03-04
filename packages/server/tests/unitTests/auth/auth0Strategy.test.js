const { Auth0Strategy } = require('../../../src/auth/auth0Strategy');
const jwt = require('jsonwebtoken');

describe('Auth0Strategy', () => {
  let auth0Strategy;

  beforeEach(() => {
    auth0Strategy = new Auth0Strategy({
      oauth: {
        auth0: {}
      }
    });
  });

  describe('configuration', () => {
    it('should return the correct configuration', () => {
      const config = auth0Strategy.configuration;
      expect(config).toHaveProperty('jwtOptions.algorithms', ['RS256']);
    });
  });

  describe('authenticate', () => {
    let mockReq, mockRes, mockNext;

    beforeEach(() => {
      mockReq = {
        headers: { authorization: 'Bearer token' }
      };
      mockRes = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };
      mockNext = jest.fn();
    });

    it('should send a 401 status if no authorization header is present', async () => {
      delete mockReq.headers.authorization;
      await auth0Strategy.authenticate(mockReq, mockRes, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.send).toHaveBeenCalledWith('No authorization header was found');
    });

    it('should send a 401 status if token could not be verified', async () => {
      jest.spyOn(jwt, 'decode').mockReturnValue(null);

      await auth0Strategy.authenticate(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.send).toHaveBeenCalledWith('Token could not be verified');
    });

    it('should add currentUserId and user object to headers on correct authentication', async () => {
      const mockDecodedToken = {
        header: { kid: 'mockKid' },
        payload: {
          sub: 'userId123',
          'http://ledge.eu/roles': ['admin', 'brand']
        }
      };

      jest.spyOn(jwt, 'decode').mockReturnValue(mockDecodedToken);

      auth0Strategy.getSigningKey = jest.fn().mockResolvedValue('mockSigningKey');

      jest.spyOn(jwt, 'verify').mockReturnValue({
        sub: 'userId123',
        'http://ledge.eu/roles': ['admin', 'brand']
      });

      await auth0Strategy.authenticate(mockReq, mockRes, mockNext);

      expect(mockReq.headers.currentUserId).toBe('userId123');
      expect(mockReq.user).toEqual({
        roles: ['admin', 'brand'],
        isAdmin: 'true',
        isBrand: 'true'
      });
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('delete user', () => {
    it('should throw an error on invalid userId', async () => {
      const userId = 'invalidUserId';
      await expect(auth0Strategy.deleteUser(userId)).rejects.toThrow('Failed to delete user');
    });
  });
});
