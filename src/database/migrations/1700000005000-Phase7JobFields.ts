import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Phase 7: richer job listings. Persists the fields the employer post/edit form
 * collects (category, experience level, skills, apply method/URL, urgent &
 * featured flags) so they round-trip instead of resetting to defaults on edit.
 */
export class Phase7JobFields1700000005000 implements MigrationInterface {
  name = 'Phase7JobFields1700000005000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "category" varchar(60)`);
    await queryRunner.query(`ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "experienceLevel" varchar(30)`);
    await queryRunner.query(`ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "skills" text`);
    await queryRunner.query(
      `ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "applyMethod" varchar(20) NOT NULL DEFAULT 'internal'`,
    );
    await queryRunner.query(`ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "applyUrl" varchar(512)`);
    await queryRunner.query(
      `ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "isUrgent" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "isFeatured" boolean NOT NULL DEFAULT false`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "jobs" DROP COLUMN IF EXISTS "isFeatured"`);
    await queryRunner.query(`ALTER TABLE "jobs" DROP COLUMN IF EXISTS "isUrgent"`);
    await queryRunner.query(`ALTER TABLE "jobs" DROP COLUMN IF EXISTS "applyUrl"`);
    await queryRunner.query(`ALTER TABLE "jobs" DROP COLUMN IF EXISTS "applyMethod"`);
    await queryRunner.query(`ALTER TABLE "jobs" DROP COLUMN IF EXISTS "skills"`);
    await queryRunner.query(`ALTER TABLE "jobs" DROP COLUMN IF EXISTS "experienceLevel"`);
    await queryRunner.query(`ALTER TABLE "jobs" DROP COLUMN IF EXISTS "category"`);
  }
}
