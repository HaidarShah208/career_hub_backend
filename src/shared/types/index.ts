import { UserRole } from '../constants';

/** The authenticated principal attached to each request by auth middleware. */
export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
}

export interface ListQuery {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}
