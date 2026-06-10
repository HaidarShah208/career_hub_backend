import { MigrationInterface, QueryRunner } from 'typeorm';

/** Phase 9: employer company verification flag for admin approval workflow. */
export class Phase9CompanyVerification1700000007000 implements MigrationInterface {
  name = 'Phase9CompanyVerification1700000007000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "isVerified" boolean NOT NULL DEFAULT true`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "companies" DROP COLUMN IF EXISTS "isVerified"`);
  }
}
