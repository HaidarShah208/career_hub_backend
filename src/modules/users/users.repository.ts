import { Repository } from 'typeorm';
import { AppDataSource } from '../../config/database';
import { UserRole } from '../../shared/constants';
import { User } from './user.entity';
import { CreateUserDto } from './users.types';

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

  async remove(user: User): Promise<void> {
    await this.repo.remove(user);
  }
}

export const usersRepository = new UsersRepository();
