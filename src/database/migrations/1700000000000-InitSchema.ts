import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Initial schema: users, companies, jobs, applications.
 *
 * Role / status fields are stored as varchar (see shared/constants for the
 * rationale). UUID primary keys default to uuid_generate_v4() from uuid-ossp.
 */
export class InitSchema1700000000000 implements MigrationInterface {
  name = 'InitSchema1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // users
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "firstName" varchar(100) NOT NULL,
        "lastName" varchar(100) NOT NULL,
        "email" varchar(255) NOT NULL,
        "password" varchar(255) NOT NULL,
        "role" varchar(20) NOT NULL DEFAULT 'CANDIDATE',
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_users_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_users_email" ON "users" ("email")`);

    // companies
    await queryRunner.query(`
      CREATE TABLE "companies" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" varchar(255) NOT NULL,
        "description" text,
        "website" varchar(255),
        "location" varchar(255),
        "ownerId" uuid NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_companies_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_companies_name" ON "companies" ("name")`);
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_companies_ownerId" ON "companies" ("ownerId")`);

    // jobs
    await queryRunner.query(`
      CREATE TABLE "jobs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "title" varchar(255) NOT NULL,
        "slug" varchar(280) NOT NULL,
        "description" text NOT NULL,
        "location" varchar(255),
        "employmentType" varchar(30) NOT NULL DEFAULT 'FULL_TIME',
        "salaryMin" integer,
        "salaryMax" integer,
        "status" varchar(20) NOT NULL DEFAULT 'OPEN',
        "companyId" uuid NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_jobs_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_jobs_title" ON "jobs" ("title")`);
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_jobs_slug" ON "jobs" ("slug")`);
    await queryRunner.query(`CREATE INDEX "IDX_jobs_status" ON "jobs" ("status")`);
    await queryRunner.query(`CREATE INDEX "IDX_jobs_companyId" ON "jobs" ("companyId")`);

    // applications
    await queryRunner.query(`
      CREATE TABLE "applications" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "candidateId" uuid NOT NULL,
        "jobId" uuid NOT NULL,
        "status" varchar(20) NOT NULL DEFAULT 'APPLIED',
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_applications_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_applications_candidate_job" UNIQUE ("candidateId", "jobId")
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_applications_candidateId" ON "applications" ("candidateId")`);
    await queryRunner.query(`CREATE INDEX "IDX_applications_jobId" ON "applications" ("jobId")`);

    // Foreign keys
    await queryRunner.query(`
      ALTER TABLE "companies"
      ADD CONSTRAINT "FK_companies_owner" FOREIGN KEY ("ownerId")
      REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "jobs"
      ADD CONSTRAINT "FK_jobs_company" FOREIGN KEY ("companyId")
      REFERENCES "companies" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "applications"
      ADD CONSTRAINT "FK_applications_candidate" FOREIGN KEY ("candidateId")
      REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "applications"
      ADD CONSTRAINT "FK_applications_job" FOREIGN KEY ("jobId")
      REFERENCES "jobs" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "applications" DROP CONSTRAINT "FK_applications_job"`);
    await queryRunner.query(`ALTER TABLE "applications" DROP CONSTRAINT "FK_applications_candidate"`);
    await queryRunner.query(`ALTER TABLE "jobs" DROP CONSTRAINT "FK_jobs_company"`);
    await queryRunner.query(`ALTER TABLE "companies" DROP CONSTRAINT "FK_companies_owner"`);

    await queryRunner.query(`DROP TABLE "applications"`);
    await queryRunner.query(`DROP TABLE "jobs"`);
    await queryRunner.query(`DROP TABLE "companies"`);
    await queryRunner.query(`DROP TABLE "users"`);
  }
}
