/**
 * ============================================================================
 * Signup unit tests — how this file works
 * ============================================================================
 *
 * What we test
 * ------------
 * `AuthService.signUp()` (POST /auth/signup business logic), NOT the Express
 * route or a real database.
 *
 * Real signup flow (from auth.service.ts):
 *   1. Look up email → if taken, throw ConflictError (409)
 *   2. Hash the password
 *   3. Create CANDIDATE user + profile (candidatesRepository.createWithUser)
 *   4. Store a verification token + send email
 *   5. Return { message, email, user }  (password never returned)
 *
 * Why mocks?
 * ----------
 * Replacing usersRepository / candidatesRepository / emailService / hashPassword
 * means:
 *   - No Postgres / Redis / SMTP needed
 *   - Tests stay fast and deterministic
 *   - We assert "was findByEmail called with X?" without side effects
 *
 * Also covered
 * ------------
 * `signUpSchema` (Zod) — same rules the HTTP layer uses before the service runs.
 *
 * Run:
 *   cd backend && npm test
 *   npm test -- tests/auth/signup.test.ts
 * ============================================================================
 */

import { ConflictError } from '../../src/shared/errors';
import { UserRole } from '../../src/shared/constants';
import { User } from '../../src/modules/users/user.entity';
import { AuthService } from '../../src/modules/auth/auth.service';
import { signUpSchema } from '../../src/modules/auth/auth.validation';
import { usersRepository } from '../../src/modules/users/users.repository';
import { candidatesRepository } from '../../src/modules/candidates/candidates.repository';
import { emailService } from '../../src/shared/services/email.service';
import { hashPassword } from '../../src/shared/utils/password';

// Replace real DB / mail / bcrypt with fakes for this file only.
jest.mock('../../src/modules/users/users.repository');
jest.mock('../../src/modules/candidates/candidates.repository');
jest.mock('../../src/shared/services/email.service');
jest.mock('../../src/shared/utils/password');

const mockedUsersRepo = usersRepository as jest.Mocked<typeof usersRepository>;
const mockedCandidatesRepo = candidatesRepository as jest.Mocked<typeof candidatesRepository>;
const mockedEmailService = emailService as jest.Mocked<typeof emailService>;
const mockedHashPassword = hashPassword as jest.MockedFunction<typeof hashPassword>;

function buildUser(overrides: Partial<User> = {}): User {
  const now = new Date('2026-01-15T10:00:00.000Z');
  return {
    id: '11111111-1111-1111-1111-111111111111',
    firstName: 'Ayesha',
    lastName: 'Khan',
    email: 'ayesha@example.com',
    password: 'hashed-password',
    role: UserRole.CANDIDATE,
    isActive: true,
    emailVerified: false,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  } as User;
}

describe('Auth signup validation (signUpSchema)', () => {
  const validBody = {
    firstName: 'Ayesha',
    lastName: 'Khan',
    email: 'ayesha@example.com',
    password: 'Secret123',
  };

  it('accepts a valid signup body', () => {
    const result = signUpSchema.safeParse({ body: validBody });
    expect(result.success).toBe(true);
  });

  it('rejects an invalid email', () => {
    const result = signUpSchema.safeParse({
      body: { ...validBody, email: 'not-an-email' },
    });
    expect(result.success).toBe(false);
  });

  it('rejects a password shorter than 8 characters', () => {
    const result = signUpSchema.safeParse({
      body: { ...validBody, password: 'short' },
    });
    expect(result.success).toBe(false);
  });

  it('rejects a first name that is too short', () => {
    const result = signUpSchema.safeParse({
      body: { ...validBody, firstName: 'A' },
    });
    expect(result.success).toBe(false);
  });
});

describe('AuthService.signUp', () => {
  const service = new AuthService();
  const dto = {
    firstName: 'Ayesha',
    lastName: 'Khan',
    email: 'ayesha@example.com',
    password: 'Secret123',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockedHashPassword.mockResolvedValue('hashed-password');
    mockedUsersRepo.setVerificationToken.mockResolvedValue(undefined);
    mockedEmailService.sendVerificationEmail.mockResolvedValue(undefined);
  });

  it('creates a candidate, hashes password, and returns a public user', async () => {
    const created = buildUser();
    mockedUsersRepo.findByEmail.mockResolvedValue(null);
    mockedCandidatesRepo.createWithUser.mockResolvedValue(created);

    const result = await service.signUp(dto);

    // 1) uniqueness check
    expect(mockedUsersRepo.findByEmail).toHaveBeenCalledWith(dto.email);

    // 2) password hashed (never stored as plain text)
    expect(mockedHashPassword).toHaveBeenCalledWith(dto.password);

    // 3) candidate + user created with hashed password
    expect(mockedCandidatesRepo.createWithUser).toHaveBeenCalledWith({
      firstName: dto.firstName,
      lastName: dto.lastName,
      email: dto.email,
      passwordHash: 'hashed-password',
    });

    // 4) verification token saved + email sent
    expect(mockedUsersRepo.setVerificationToken).toHaveBeenCalledWith(
      created.id,
      expect.any(String),
      expect.any(Date),
    );
    expect(mockedEmailService.sendVerificationEmail).toHaveBeenCalledWith(
      created.email,
      expect.stringContaining('/auth/verify-email?token='),
      created.firstName,
    );

    // 5) API-safe response (no password field)
    expect(result.email).toBe(dto.email);
    expect(result.message).toMatch(/verify your email/i);
    expect(result.user).toEqual(
      expect.objectContaining({
        id: created.id,
        email: created.email,
        firstName: created.firstName,
        lastName: created.lastName,
        role: UserRole.CANDIDATE,
        emailVerified: false,
      }),
    );
    expect(result.user).not.toHaveProperty('password');
  });

  it('throws ConflictError when the email is already registered', async () => {
    mockedUsersRepo.findByEmail.mockResolvedValue(buildUser());

    await expect(service.signUp(dto)).rejects.toBeInstanceOf(ConflictError);
    await expect(service.signUp(dto)).rejects.toThrow(
      'An account with this email already exists',
    );

    expect(mockedCandidatesRepo.createWithUser).not.toHaveBeenCalled();
    expect(mockedEmailService.sendVerificationEmail).not.toHaveBeenCalled();
  });
});
