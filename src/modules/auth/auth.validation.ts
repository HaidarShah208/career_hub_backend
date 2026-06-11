import { z } from 'zod';

export const signInSchema = z.object({
  body: z.object({
    email: z.string({ required_error: 'Email is required' }).email('A valid email is required'),
    password: z.string({ required_error: 'Password is required' }).min(1, 'Password is required'),
  }),
});

export const signUpSchema = z.object({
  body: z.object({
    firstName: z.string({ required_error: 'First name is required' }).min(2, 'First name is too short').max(100),
    lastName: z.string({ required_error: 'Last name is required' }).min(1, 'Last name is required').max(100),
    email: z.string({ required_error: 'Email is required' }).email('A valid email is required'),
    password: z
      .string({ required_error: 'Password is required' })
      .min(8, 'Password must be at least 8 characters')
      .max(128),
  }),
});

export const refreshSchema = z.object({
  body: z.object({
    refreshToken: z.string({ required_error: 'Refresh token is required' }).min(10, 'A valid refresh token is required'),
  }),
});

export const verifyEmailSchema = z.object({
  body: z.object({
    token: z.string({ required_error: 'Verification token is required' }).min(10),
  }),
});

export const resendVerificationSchema = z.object({
  body: z.object({
    email: z.string({ required_error: 'Email is required' }).email('A valid email is required'),
  }),
});
