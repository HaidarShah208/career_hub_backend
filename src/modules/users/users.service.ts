import { NotFoundError } from '../../shared/errors';
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
}

export const usersService = new UsersService();
