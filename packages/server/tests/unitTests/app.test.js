// Mock the connect method of mongodb, for avoiding connect errors
jest.mock('mongodb', () => {
  const originalModule = jest.requireActual('mongodb');

  return {
    ...originalModule,
    MongoClient: {
      ...originalModule.MongoClient,
      connect: jest.fn().mockImplementation(() => Promise.resolve({
        db: jest.fn().mockReturnValue({
        }),
      })),
    },
  };
});

const request = require('supertest');

describe('express app', () => {

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it('should call app.use for each service', () => {

    jest.mock('express', () => {
      const mockRouter = () => {
        const router = jest.fn();
        router.use = jest.fn(() => router);
        router.get = jest.fn(() => router);
        router.post = jest.fn(() => router);
        router.patch = jest.fn(() => router);
        router.delete = jest.fn(() => router);
        router.put = jest.fn(() => router);
        return router;
      };

      const express = jest.fn(() => ({
        use: jest.fn(),
        set: jest.fn(),
        listen: jest.fn(),
        get: jest.fn()
      }));

      express.Router = mockRouter;
      return express;
    });

    const app = require('../../src/app');
    const services = require('../../src/services');

    // Perform logic
    services.forEach((service) => {
      expect(app.use).toHaveBeenCalledWith(service.path, service.router);
    });
  });

  it('should initialize mongodb correctly', async () => {

    const app = require('../../src/app');
    expect(app.set).toHaveBeenCalledWith('mongodbClient', expect.any(Promise));
  });
});
