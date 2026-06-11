import { Repository } from 'typeorm';
import { AppDataSource } from '../../config/database';
import { UserRole } from '../../shared/constants';
import { User } from './user.entity';
import { CreateUserDto, ListUsersQuery } from './users.types';

/**
 * Data-access layer for the User entity. All persistence concerns live here;
 * services never touch the ORM directly.
 */
export class UsersRepository {
  private get repo(): Repository<User> {
    return AppDataSource.getRepository(User);
  }

  findById(id: string): Promise<User | null> {
    return this.repo.findOne({ where: { id } });
  }

  findByEmail(email: string): Promise<User | null> {
    return this.repo.findOne({ where: { email: email.toLowerCase() } });
  }

  /** Includes the (normally hidden) password column for authentication. */
  findByEmailWithPassword(email: string): Promise<User | null> {
    return this.repo
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.email = :email', { email: email.toLowerCase() })
      .getOne();
  }

  create(data: CreateUserDto): User {
    return this.repo.create({ ...data, email: data.email.toLowerCase() });
  }

  save(user: User): Promise<User> {
    return this.repo.save(user);
  }

  count(): Promise<number> {
    return this.repo.count();
  }

  countByRole(role: UserRole): Promise<number> {
    return this.repo.count({ where: { role } });
  }

  async findAndCount(query: ListUsersQuery, excludeUserId?: string): Promise<[User[], number]> {
    const { page, limit, search, role, sortOrder } = query;
    const qb = this.repo
      .createQueryBuilder('user')
      .orderBy('user.createdAt', sortOrder)
      .skip((page - 1) * limit)
      .take(limit);

    if (excludeUserId) qb.andWhere('user.id != :excludeUserId', { excludeUserId });
    if (role) qb.andWhere('user.role = :role', { role });
    if (search) {
      qb.andWhere(
        '(user.firstName ILIKE :search OR user.lastName ILIKE :search OR user.email ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    return qb.getManyAndCount();
  }

  async setActive(id: string, isActive: boolean): Promise<User | null> {
    await this.repo.update({ id }, { isActive });
    return this.findById(id);
  }

  findByVerificationToken(token: string): Promise<User | null> {
    return this.repo
      .createQueryBuilder('user')
      .addSelect('user.emailVerificationToken')
      .addSelect('user.emailVerificationExpires')
      .where('user.emailVerificationToken = :token', { token })
      .getOne();
  }

  async markEmailVerified(id: string): Promise<User | null> {
    // Keep the token so re-opening the same email link is idempotent (Strict Mode, double-click).
    await this.repo.update({ id }, { emailVerified: true });
    return this.findById(id);
  }

  async setVerificationToken(id: string, token: string, expires: Date): Promise<void> {
    await this.repo.update(
      { id },
      { emailVerificationToken: token, emailVerificationExpires: expires, emailVerified: false },
    );
  }

  /** Registrations grouped by calendar day for the last N days. */
  async countPerDay(days: number): Promise<Array<{ period: Date; count: number }>> {
    const since = new Date();
    since.setDate(since.getDate() - (days - 1));
    since.setHours(0, 0, 0, 0);

    const rows = await this.repo
      .createQueryBuilder('user')
      .select("DATE_TRUNC('day', user.createdAt)", 'period')
      .addSelect('COUNT(user.id)', 'count')
      .where('user.createdAt >= :since', { since })
      .groupBy("DATE_TRUNC('day', user.createdAt)")
      .orderBy("DATE_TRUNC('day', user.createdAt)", 'ASC')
      .getRawMany<{ period: Date; count: string }>();

    return rows.map((r) => ({ period: new Date(r.period), count: Number(r.count) }));
  }

  async remove(user: User): Promise<void> {
    await this.repo.remove(user);
  }
}

export const usersRepository = new UsersRepository();
