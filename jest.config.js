/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  clearMocks: true,
  // Loads JWT / FRONTEND_URL before any src module that validates `env`.
  setupFiles: ['<rootDir>/tests/setup-env.ts'],
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.jest.json',
      },
    ],
  },
  // Mirrors tsconfig baseUrl so imports like `shared/...` resolve if used.
  moduleDirectories: ['node_modules', 'src'],
  // API suites hit Postgres + bcrypt — allow slower runs than pure unit tests.
  testTimeout: 30_000,
};
