/**
 * ============================================================================
 * Signup API integration test — how this file works
 * ============================================================================
 *
 * Flow under test (full stack, no mocks of auth/business layers):
 *
 *   Supertest  →  Express (createApp)
 *             →  Route      POST /api/v1/auth/signup
 *             →  Controller authController.signUp
 *             →  AuthService.signUp
 *             →  Repository (users + candidates)
 *             →  PostgreSQL (real DB from backend/.env)
 *             →  HTTP Response
 *             →  Jest assertions
 *
 * What "real" means here
 * ----------------------
 * - Real Express router, validation middleware, controller, service
 * - Real TypeORM repositories writing to your local Postgres
 * - Email is NOT mocked: without SMTP it only logs (see email.service)
 * - Redis is not required for signup (lazyConnect, unused on this path)
 *
 * Cleanup
 * -------
 * Each test uses a unique email and deletes that user (+ profile) afterwards
 * so we do not leave permanent junk in career_hub.
 *
 * Prerequisites
 * -------------
 * - PostgreSQL running with DATABASE_* from backend/.env
 * - Schema already migrated / synchronized
 *
 * Run:
 *   cd backend && npm test -- tests/auth/signup.api.test.ts
 * ============================================================================
 */

import request from 'supertest';
import { Application } from 'express';
import { AppDataSource } from '../../src/config/database';
import { User } from '../../src/modules/users/user.entity';
import { CandidateProfile } from '../../src/modules/candidates/candidate-profile.entity';
import { UserRole } from '../../src/shared/constants';
import { env } from '../../src/config/env';
import {
  deleteUserByEmail,
  setupTestApp,
  teardownTestApp,
} from '../helpers/app';

describe('POST /auth/signup (API + real DB)', () => {
  let app: Application;
  const createdEmails: string[] = [];

  /** Unique email so parallel/re-runs never clash with existing rows. */
  function uniqueEmail(label: string): string {
    const email = `signup.api.${label}.${Date.now()}.${Math.random().toString(36).slice(2, 8)}@example.com`;
    createdEmails.push(email);
    return email;
  }

  beforeAll(async () => {
    app = await setupTestApp();
  }, 60_000);

  afterAll(async () => {
    // Best-effort cleanup if a test failed mid-way.
    for (const email of createdEmails) {
      await deleteUserByEmail(email).catch(() => undefined);
    }
    await teardownTestApp();
  }, 30_000);

  afterEach(async () => {
    while (createdEmails.length > 0) {
      const email = createdEmails.pop()!;
      await deleteUserByEmail(email);
    }
  });

  it('registers a candidate through the full HTTP stack and persists to DB', async () => {
    const email = uniqueEmail('ok');
    const body = {
      firstName: 'Hassan',
      lastName: 'Ali',
      email,
      password: 'Secret123',
    };

    const res = await request(app)
      .post(`${env.API_PREFIX}/auth/signup`)
      .send(body)
      .expect(201);

    // ── HTTP envelope from controller → sendSuccess ──────────────────────
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/verify your email/i);
    expect(res.body.data.email).toBe(email.toLowerCase());
    expect(res.body.data.user).toEqual(
      expect.objectContaining({
        email: email.toLowerCase(),
        firstName: 'Hassan',
        lastName: 'Ali',
        role: UserRole.CANDIDATE,
        emailVerified: false,
        isActive: true,
      }),
    );
    expect(res.body.data.user).not.toHaveProperty('password');

    // ── Real DB: user row ────────────────────────────────────────────────
    const user = await AppDataSource.getRepository(User)
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.email = :email', { email: email.toLowerCase() })
      .getOne();

    expect(user).not.toBeNull();
    expect(user!.role).toBe(UserRole.CANDIDATE);
    expect(user!.emailVerified).toBe(false);
    expect(user!.password).not.toBe(body.password);
    expect(user!.password.startsWith('$2')).toBe(true); // bcrypt hash

    // ── Real DB: candidate profile created atomically with user ──────────
    const profile = await AppDataSource.getRepository(CandidateProfile).findOne({
      where: { userId: user!.id },
    });
    expect(profile).not.toBeNull();
    expect(profile!.experienceYears).toBe(0);
  });

  it('returns 409 when the email is already registered', async () => {
    const email = uniqueEmail('dup');
    const body = {
      firstName: 'First',
      lastName: 'User',
      email,
      password: 'Secret123',
    };

    await request(app).post(`${env.API_PREFIX}/auth/signup`).send(body).expect(201);

    const res = await request(app)
      .post(`${env.API_PREFIX}/auth/signup`)
      .send({ ...body, firstName: 'Second' })
      .expect(409);

    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/already exists/i);
  });

  it('returns 422 when the body fails Zod validation', async () => {
    const res = await request(app)
      .post(`${env.API_PREFIX}/auth/signup`)
      .send({
        firstName: 'A',
        lastName: 'Ali',
        email: 'not-an-email',
        password: 'short',
      })
      .expect(422);

    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/validation/i);
    expect(Array.isArray(res.body.errors)).toBe(true);
    expect(res.body.errors.length).toBeGreaterThan(0);
  });
});
