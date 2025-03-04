module.exports = {
  testEnvironment: 'node',
  collectCoverage: true,
  collectCoverageFrom: ['**/src/**/*.js', '!**/node_modules/**'],
  coverageDirectory: 'coverage',
  globalSetup: '<rootDir>/jest.setup.js',
  setupFilesAfterEnv: ['<rootDir>/jest.fetch.setup.js'],
  verbose: false,
};
