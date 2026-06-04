import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Phase 4: extra company profile fields used by the employer recruiter
 * workflow. The new INTERVIEW_SCHEDULED application status needs no DDL because
 * statuses are stored as plain varchar.
 */
export class Phase4EmployerCompany1700000003000 implements MigrationInterface {
  name = 'Phase4EmployerCompany1700000003000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "industry" varchar(120)`);
    await queryRunner.query(
      `ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "companySize" varchar(50)`,
    );
    await queryRunner.query(`ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "foundedYear" integer`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "companies" DROP COLUMN IF EXISTS "foundedYear"`);
    await queryRunner.query(`ALTER TABLE "companies" DROP COLUMN IF EXISTS "companySize"`);
    await queryRunner.query(`ALTER TABLE "companies" DROP COLUMN IF EXISTS "industry"`);
  }
}
