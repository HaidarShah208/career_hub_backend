/**
 * Application-wide enums and constants.
 *
 * Role / status values are stored as plain strings in PostgreSQL (varchar)
 * rather than native PG enums. This keeps migrations simple and avoids the
 * well-known pain of altering native enum types in production, while we still
 * get full compile-time safety through these TypeScript enums + Zod schemas.
 */

export enum UserRole {
  ADMIN = 'ADMIN',
  EMPLOYER = 'EMPLOYER',
  CANDIDATE = 'CANDIDATE',
}

export enum JobStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  CLOSED = 'CLOSED',
}

export enum EmploymentType {
  FULL_TIME = 'FULL_TIME',
  PART_TIME = 'PART_TIME',
  REMOTE = 'REMOTE',
  INTERNSHIP = 'INTERNSHIP',
  CONTRACT = 'CONTRACT',
}

export enum ApplicationStatus {
  APPLIED = 'APPLIED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  SHORTLISTED = 'SHORTLISTED',
  INTERVIEW_SCHEDULED = 'INTERVIEW_SCHEDULED',
  REJECTED = 'REJECTED',
  HIRED = 'HIRED',
}

export const USER_ROLES = Object.values(UserRole);
export const JOB_STATUSES = Object.values(JobStatus);
export const EMPLOYMENT_TYPES = Object.values(EmploymentType);
export const APPLICATION_STATUSES = Object.values(ApplicationStatus);

export enum EmployerStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  SUSPENDED = 'SUSPENDED',
}

export enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  PENDING_PAYMENT = 'PENDING_PAYMENT',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
  SUSPENDED = 'SUSPENDED',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
  CANCELLED = 'CANCELLED',
}

export enum PaymentMethod {
  STRIPE = 'STRIPE',
  EASYPAISA = 'EASYPAISA',
  JAZZCASH = 'JAZZCASH',
  BANK_TRANSFER = 'BANK_TRANSFER',
}

export enum BillingCycle {
  MONTHLY = 'MONTHLY',
  YEARLY = 'YEARLY',
}

export const EMPLOYER_STATUSES = Object.values(EmployerStatus);
export const SUBSCRIPTION_STATUSES = Object.values(SubscriptionStatus);
export const PAYMENT_STATUSES = Object.values(PaymentStatus);
export const PAYMENT_METHODS = Object.values(PaymentMethod);
export const BILLING_CYCLES = Object.values(BillingCycle);

/** Redis cache keys. */
export const CACHE_KEYS = {
  JOBS_ALL: 'jobs:all',
} as const;

/** Cache TTLs (in seconds). */
export const CACHE_TTL = {
  JOBS: 60 * 5, // 5 minutes
} as const;

/** Pagination defaults. */
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
} as const;
