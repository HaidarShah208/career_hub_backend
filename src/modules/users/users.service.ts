import { cache } from '../../config/redis';
import { CACHE_KEYS, UserRole } from '../../shared/constants';
import { BadRequestError, NotFoundError, UnauthorizedError } from '../../shared/errors';
import { deleteByUrl } from '../../shared/services/cloudinary.service';
import { comparePassword, hashPassword } from '../../shared/utils/password';
import { authRepository } from '../auth/auth.repository';
import { candidatesRepository } from '../candidates/candidates.repository';
import { companiesRepository } from '../companies/companies.repository';
import { toPublicUser } from './user.mapper';
import { usersRepository, UsersRepository } from './users.repository';
import { PublicUser } from './users.types';

export class UsersService {
  constructor(private readonly repo: UsersRepository = usersRepository) {}

  async getById(id: string): Promise<PublicUser> {
    const user = await this.repo.findById(id);
    if (!user) {
      throw new NotFoundError('User not found');
    }
    return toPublicUser(user);
  }

  /**
   * Permanently deletes the authenticated user and all related data (profile,
   * applications, owned companies/jobs, uploaded files). Cascading FKs handle
   * most relational cleanup; Cloudinary assets and refresh tokens are removed
   * explicitly first.
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    const user = await this.repo.findByIdWithPassword(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const valid = await comparePassword(currentPassword, user.password);
    if (!valid) {
      throw new UnauthorizedError('Current password is incorrect');
    }

    if (currentPassword === newPassword) {
      throw new BadRequestError('New password must be different from your current password');
    }

    const passwordHash = await hashPassword(newPassword);
    await this.repo.updatePassword(user.id, passwordHash);

    return { message: 'Password updated successfully' };
  }

  async deleteAccount(userId: string): Promise<void> {
    const user = await this.repo.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }
    if (user.role === UserRole.ADMIN) {
      throw new BadRequestError('Admin accounts cannot be deleted');
    }

    const profile = await candidatesRepository.findByUserId(userId);
    if (profile) {
      await deleteByUrl(profile.avatarUrl, 'image');
      await deleteByUrl(profile.resumeUrl, 'raw');
    }

    const company = await companiesRepository.findByOwnerId(userId);
    if (company) {
      await deleteByUrl(company.logo, 'image');
    }

    await authRepository.removeRefreshToken(userId);
    await this.repo.remove(user);
    await cache.del(CACHE_KEYS.JOBS_ALL);
  }
}

export const usersService = new UsersService();
