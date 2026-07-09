import { MigrationInterface, QueryRunner } from 'typeorm';
import { JOB_CATEGORIES } from '../../shared/constants';

export class Phase13JobCategories1700000011000 implements MigrationInterface {
  name = 'Phase13JobCategories1700000011000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "job_categories" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "slug" varchar(60) NOT NULL,
        "name" varchar(100) NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_job_categories" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_job_categories_slug" UNIQUE ("slug")
      )
    `);

    for (const cat of JOB_CATEGORIES) {
      await queryRunner.query(
        `INSERT INTO "job_categories" ("slug", "name") VALUES ($1, $2) ON CONFLICT ("slug") DO NOTHING`,
        [cat.value, cat.label],
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "job_categories"`);
  }
}
