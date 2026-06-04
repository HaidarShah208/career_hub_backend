import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Phase 6: file uploads. Candidate profiles gain an `avatarUrl` column.
 * `candidate_profiles.resumeUrl` and `companies.logo` already exist and are
 * reused to store the uploaded resume and company logo URLs respectively.
 */
export class Phase6Uploads1700000004000 implements MigrationInterface {
  name = 'Phase6Uploads1700000004000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "candidate_profiles" ADD COLUMN IF NOT EXISTS "avatarUrl" varchar(512)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "candidate_profiles" DROP COLUMN IF EXISTS "avatarUrl"`);
  }
}
