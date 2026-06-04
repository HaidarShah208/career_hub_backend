import { UserRole } from '../../shared/constants';
import { ConflictError, ForbiddenError, UnauthorizedError } from '../../shared/errors';
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
import { AuthResult, AuthTokens, SignInDto, SignUpDto } from './auth.types';

export class AuthService {
  constructor(private readonly repo: AuthRepository = authRepository) {}

  private async issueTokens(payload: TokenPayload): Promise<AuthTokens> {
    const tokens = signTokenPair(payload);
    await this.repo.storeRefreshToken(payload.sub, tokens.refreshToken);
    return tokens;
  }

  /** POST /auth/signup — registers a new CANDIDATE (user + profile). */
  async signUp(dto: SignUpDto): Promise<AuthResult> {
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

    const tokens = await this.issueTokens({ sub: user.id, email: user.email, role: user.role });
    return { user: toPublicUser(user), ...tokens };
  }

  /** Verifies email + password and returns the active user, or throws. */
  private async verifyCredentials(dto: SignInDto): Promise<User> {
    const user = await this.repo.findByEmailWithPassword(dto.email);

    // Same generic error for "no user" and "wrong password" to avoid leaking
    // which emails exist.
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

    return user;
  }

  /** POST /auth/signin */
  async signIn(dto: SignInDto): Promise<AuthResult> {
    const user = await this.verifyCredentials(dto);
    const tokens = await this.issueTokens({ sub: user.id, email: user.email, role: user.role });
    return { user: toPublicUser(user), ...tokens };
  }

  /** POST /employers/signup — registers a new EMPLOYER account. */
  async registerEmployer(dto: SignUpDto): Promise<AuthResult> {
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

    const tokens = await this.issueTokens({ sub: saved.id, email: saved.email, role: saved.role });
    return { user: toPublicUser(saved), ...tokens };
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

  /** POST /auth/refresh */
  async refresh(refreshToken: string): Promise<AuthTokens> {
    const payload = verifyRefreshToken(refreshToken);

    // When Redis is available we enforce that the token is the latest issued
    // one (supports logout / rotation). When it is unavailable we fall back to
    // signature-only verification so auth keeps working.
    const stored = await this.repo.getRefreshToken(payload.sub);
    if (stored && stored !== refreshToken) {
      throw new UnauthorizedError('Refresh token has been revoked');
    }

    const user = await this.repo.findById(payload.sub);
    if (!user || !user.isActive) {
      throw new UnauthorizedError('User no longer exists or is inactive');
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
