import crypto from 'crypto';
import { UserRole } from '../../shared/constants';
import { env } from '../../config/env';
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from '../../shared/errors';
import { emailService } from '../../shared/services/email.service';
import { comparePassword, hashPassword } from '../../shared/utils/password';
import {
  signTokenPair,
  TokenPayload,
  verifyRefreshToken,
} from '../../shared/utils/jwt';
import { User } from '../users/user.entity';
import { toPublicUser } from '../users/user.mapper';
import { PublicUser } from '../users/users.types';
import { usersRepository } from '../users/users.repository';
import { candidatesRepository } from '../candidates/candidates.repository';
import { authRepository, AuthRepository } from './auth.repository';
import { AuthResult, AuthTokens, SignInDto, SignUpDto, SignUpResult } from './auth.types';

const VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;

export class AuthService {
  constructor(private readonly repo: AuthRepository = authRepository) {}

  private async issueTokens(payload: TokenPayload): Promise<AuthTokens> {
    const tokens = signTokenPair(payload);
    await this.repo.storeRefreshToken(payload.sub, tokens.refreshToken);
    return tokens;
  }

  private createVerificationToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  private buildVerificationUrl(token: string): string {
    const base = env.FRONTEND_URL.replace(/\/$/, '');
    return `${base}/auth/verify-email?token=${token}`;
  }

  private async sendVerificationEmail(user: User): Promise<void> {
    const token = this.createVerificationToken();
    const expires = new Date(Date.now() + VERIFICATION_TTL_MS);
    await usersRepository.setVerificationToken(user.id, token, expires);
    const url = this.buildVerificationUrl(token);
    await emailService.sendVerificationEmail(user.email, url, user.firstName);
  }

  /** POST /auth/signup — registers a new CANDIDATE (user + profile). */
  async signUp(dto: SignUpDto): Promise<SignUpResult> {
    const existing = await usersRepository.findByEmail(dto.email);
    if (existing) {
      throw new ConflictError('An account with this email already exists');
    }

    const passwordHash = await hashPassword(dto.password);
    const user = await candidatesRepository.createWithUser({
      firstName: dto.firstName,
      lastName: dto.lastName,
      email: dto.email,
      passwordHash,
    });

    await this.sendVerificationEmail(user);

    return {
      message: 'Please verify your email. We sent a verification link to your inbox.',
      email: user.email,
      user: toPublicUser(user),
    };
  }

  /** Verifies email + password and returns the active user, or throws. */
  private async verifyCredentials(dto: SignInDto): Promise<User> {
    const user = await this.repo.findByEmailWithPassword(dto.email);

    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const passwordMatches = await comparePassword(dto.password, user.password);
    if (!passwordMatches) {
      throw new UnauthorizedError('Invalid email or password');
    }

    if (!user.isActive) {
      throw new ForbiddenError('Your account has been deactivated');
    }

    if (!user.emailVerified) {
      throw new ForbiddenError(
        'Please verify your email before signing in. Check your inbox for the verification link.',
      );
    }

    return user;
  }

  /** POST /auth/signin */
  async signIn(dto: SignInDto): Promise<AuthResult> {
    const user = await this.verifyCredentials(dto);
    const tokens = await this.issueTokens({ sub: user.id, email: user.email, role: user.role });
    return { user: toPublicUser(user), ...tokens };
  }

  /** POST /employers/signup — registers a new EMPLOYER account. */
  async registerEmployer(dto: SignUpDto): Promise<SignUpResult> {
    const existing = await usersRepository.findByEmail(dto.email);
    if (existing) {
      throw new ConflictError('An account with this email already exists');
    }

    const passwordHash = await hashPassword(dto.password);
    const user = usersRepository.create({
      firstName: dto.firstName,
      lastName: dto.lastName,
      email: dto.email,
      password: passwordHash,
      role: UserRole.EMPLOYER,
    });
    const saved = await usersRepository.save(user);

    await this.sendVerificationEmail(saved);

    return {
      message: 'Please verify your email. We sent a verification link to your inbox.',
      email: saved.email,
      user: toPublicUser(saved),
    };
  }

  /** POST /employers/signin — enforces the EMPLOYER role. */
  async signInEmployer(dto: SignInDto): Promise<AuthResult> {
    const user = await this.verifyCredentials(dto);
    if (user.role !== UserRole.EMPLOYER) {
      throw new ForbiddenError('This login is for employer accounts only');
    }
    const tokens = await this.issueTokens({ sub: user.id, email: user.email, role: user.role });
    return { user: toPublicUser(user), ...tokens };
  }

  /** POST /auth/verify-email */
  async verifyEmail(token: string): Promise<{ message: string; user: PublicUser }> {
    const normalized = token?.trim();
    if (!normalized) {
      throw new BadRequestError('Verification token is required');
    }

    const user = await usersRepository.findByVerificationToken(normalized);
    if (!user) {
      throw new BadRequestError(
        'Invalid verification link. If you already verified, try signing in.',
      );
    }

    if (user.emailVerified) {
      return { message: 'Email is already verified. You can sign in.', user: toPublicUser(user) };
    }

    if (!user.emailVerificationExpires || user.emailVerificationExpires < new Date()) {
      throw new BadRequestError('Verification link has expired. Request a new one.');
    }

    const verified = await usersRepository.markEmailVerified(user.id);
    if (!verified) {
      throw new NotFoundError('User not found');
    }

    return {
      message: 'Email verified successfully. You can now sign in.',
      user: toPublicUser(verified),
    };
  }

  /** POST /auth/resend-verification */
  async resendVerification(email: string): Promise<{ message: string }> {
    const user = await usersRepository.findByEmail(email);
    if (!user) {
      return { message: 'If an account exists for this email, a verification link has been sent.' };
    }

    if (user.emailVerified) {
      return { message: 'This email is already verified. You can sign in.' };
    }

    await this.sendVerificationEmail(user);
    return { message: 'If an account exists for this email, a verification link has been sent.' };
  }

  /** POST /auth/refresh */
  async refresh(refreshToken: string): Promise<AuthTokens> {
    const payload = verifyRefreshToken(refreshToken);

    const stored = await this.repo.getRefreshToken(payload.sub);
    if (stored && stored !== refreshToken) {
      throw new UnauthorizedError('Refresh token has been revoked');
    }

    const user = await this.repo.findById(payload.sub);
    if (!user || !user.isActive) {
      throw new UnauthorizedError('User no longer exists or is inactive');
    }

    if (!user.emailVerified) {
      throw new ForbiddenError('Please verify your email before continuing.');
    }

    return this.issueTokens({ sub: user.id, email: user.email, role: user.role });
  }

  /** POST /auth/logout */
  async logout(userId: string): Promise<void> {
    await this.repo.removeRefreshToken(userId);
  }

  /** GET /auth/me */
  async me(userId: string): Promise<PublicUser> {
    const user = await this.repo.findById(userId);
    if (!user) {
      throw new UnauthorizedError('User not found');
    }
    return toPublicUser(user);
  }
}

export const authService = new AuthService();
