import { MigrationInterface, QueryRunner } from 'typeorm';

/** Phase 8: track how many times each published job detail page was opened. */
export class Phase8JobViews1700000006000 implements MigrationInterface {
  name = 'Phase8JobViews1700000006000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "viewCount" integer NOT NULL DEFAULT 0`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "jobs" DROP COLUMN IF EXISTS "viewCount"`);
  }
}
