import { PublicUser } from '../users/users.types';

export interface SignInDto {
  email: string;
  password: string;
}

export interface SignUpDto {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResult extends AuthTokens {
  user: PublicUser;
}
