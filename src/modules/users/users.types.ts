import { UserRole } from '../../shared/constants';

/** A User safe to expose over the API (never contains the password hash). */
export interface PublicUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserDto {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role?: UserRole;
}

export interface ListUsersQuery {
  page: number;
  limit: number;
  search?: string;
  role?: UserRole;
  sortOrder: 'ASC' | 'DESC';
}
