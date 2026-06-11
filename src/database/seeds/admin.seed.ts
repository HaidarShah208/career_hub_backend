import { DataSource } from 'typeorm';
import { env } from '../../config/env';
import { UserRole } from '../../shared/constants';
import { logger } from '../../shared/logger';
import { hashPassword } from '../../shared/utils/password';
import { User } from '../../modules/users/user.entity';

/**
 * Seeds the default administrator account.
 *
 * Idempotent: if an admin with the configured email already exists, it does
 * nothing. Run with `npm run seed`.
 */
export async function seedAdmin(dataSource: DataSource): Promise<void> {
  const userRepo = dataSource.getRepository(User);
  const email = env.ADMIN_EMAIL.toLowerCase();

  const existing = await userRepo.findOne({ where: { email } });
  if (existing) {
    if (!existing.emailVerified) {
      existing.emailVerified = true;
      await userRepo.save(existing);
      logger.info(`Admin user email marked verified (${email})`);
    } else {
      logger.info(`Admin user already exists (${email}) - skipping`);
    }
    return;
  }

  const admin = userRepo.create({
    firstName: env.ADMIN_FIRST_NAME,
    lastName: env.ADMIN_LAST_NAME,
    email,
    password: await hashPassword(env.ADMIN_PASSWORD),
    role: UserRole.ADMIN,
    isActive: true,
    emailVerified: true,
  });

  await userRepo.save(admin);
  logger.info(`Admin user created: ${email}`);
}
