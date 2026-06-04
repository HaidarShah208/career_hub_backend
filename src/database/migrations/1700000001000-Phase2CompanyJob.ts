import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Phase 2 changes:
 *  - companies.logo column.
 *  - companies.ownerId: unique (1-1) -> non-unique index (a user may own many).
 *  - jobs.status default OPEN -> PUBLISHED, and migrate existing enum values
 *    (OPEN -> PUBLISHED, ARCHIVED -> CLOSED, TEMPORARY -> CONTRACT).
 */
export class Phase2CompanyJob1700000001000 implements MigrationInterface {
  name = 'Phase2CompanyJob1700000001000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // companies.logo
    await queryRunner.query(`ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "logo" varchar(512)`);

    // Relax ownerId from unique to a plain index.
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_companies_ownerId"`);
    await queryRunner.query(`CREATE INDEX "IDX_companies_ownerId" ON "companies" ("ownerId")`);

    // jobs.status default + data migration.
    await queryRunner.query(`ALTER TABLE "jobs" ALTER COLUMN "status" SET DEFAULT 'PUBLISHED'`);
    await queryRunner.query(`UPDATE "jobs" SET "status" = 'PUBLISHED' WHERE "status" = 'OPEN'`);
    await queryRunner.query(`UPDATE "jobs" SET "status" = 'CLOSED' WHERE "status" = 'ARCHIVED'`);

    // employmentType data migration (TEMPORARY removed in favour of REMOTE/CONTRACT).
    await queryRunner.query(
      `UPDATE "jobs" SET "employmentType" = 'CONTRACT' WHERE "employmentType" = 'TEMPORARY'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "jobs" ALTER COLUMN "status" SET DEFAULT 'OPEN'`);
    await queryRunner.query(`UPDATE "jobs" SET "status" = 'OPEN' WHERE "status" = 'PUBLISHED'`);

    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_companies_ownerId"`);
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_companies_ownerId" ON "companies" ("ownerId")`);

    await queryRunner.query(`ALTER TABLE "companies" DROP COLUMN IF EXISTS "logo"`);
  }
}
