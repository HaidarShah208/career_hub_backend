/**
 * Runs before every Jest suite.
 * AuthService (and password/email helpers) import `config/env`, which validates
 * JWT secrets on first load — without these, importing signup code would crash.
 */
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-at-least-10-chars';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-at-least-10';
process.env.FRONTEND_URL = 'http://localhost:5173';
process.env.BCRYPT_SALT_ROUNDS = '10';
