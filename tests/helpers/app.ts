import 'reflect-metadata';
import { Application } from 'express';
import { createApp } from '../../src/app/app';
import { AppDataSource } from '../../src/config/database';
import { User } from '../../src/modules/users/user.entity';
import { CandidateProfile } from '../../src/modules/candidates/candidate-profile.entity';

/** Connects TypeORM once and returns the Express app (no HTTP listen). */
export async function setupTestApp(): Promise<Application> {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }
  return createApp();
}

/** Closes the DB pool so Jest can exit cleanly. */
export async function teardownTestApp(): Promise<void> {
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
  }
}

/** Removes a signup test user + candidate profile from the real DB. */
export async function deleteUserByEmail(email: string): Promise<void> {
  const normalized = email.toLowerCase();
  const users = AppDataSource.getRepository(User);
  const user = await users.findOne({ where: { email: normalized } });
  if (!user) return;

  await AppDataSource.getRepository(CandidateProfile).delete({ userId: user.id });
  await users.delete({ id: user.id });
}
