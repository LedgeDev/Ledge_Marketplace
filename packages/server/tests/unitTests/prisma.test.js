const prisma = require('../../src/prisma');

const { PrismaClient } = require('@prisma/client');

describe('Prisma Client Initialization', () => {
  test('should be an instance of PrismaClient', () => {
    expect(prisma).toBeInstanceOf(PrismaClient);
  });
});
