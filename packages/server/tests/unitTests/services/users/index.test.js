const request = require('supertest');
const express = require('express');
const bodyParser = require('body-parser');
const { path, router } = require('../../../../src/services/users/index');
const prisma = require('../../../../src/prisma');
const cors = require('cors');

const app = express();

// Body Parser Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// CORS Middleware
app.use(cors());

app.use(path, router);

jest.mock('../../../../src/prisma', () => ({
  users: {
    findUnique: jest.fn(),
  },
  brands: {
    findMany: jest.fn(),
  },
}));

// Mock the authenticate method
jest.mock('../../../../src/authentication', () => ({
  authenticate: (req, res, next) => {
    req.headers.currentUserId = '123';
    next();
  },
}));


describe('User Service Tests', () => {
  // This test is just here to avoid the "no tests found" warning.
  // Must be removed when the first useful test is added.
  it('should be defined', () => {
    expect(router).toBeDefined();
  });
});
