import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Phase 3 schema: candidate_profiles + application_status_history (timeline).
 */
export class Phase3CandidateApplications1700000002000 implements MigrationInterface {
  name = 'Phase3CandidateApplications1700000002000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // candidate_profiles
    await queryRunner.query(`
      CREATE TABLE "candidate_profiles" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL,
        "headline" varchar(160),
        "bio" text,
        "skills" text,
        "experienceYears" integer NOT NULL DEFAULT 0,
        "city" varchar(120),
        "resumeUrl" varchar(512),
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_candidate_profiles_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_candidate_profiles_userId" ON "candidate_profiles" ("userId")`,
    );
    await queryRunner.query(`
      ALTER TABLE "candidate_profiles"
      ADD CONSTRAINT "FK_candidate_profiles_user" FOREIGN KEY ("userId")
      REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    // application_status_history
    await queryRunner.query(`
      CREATE TABLE "application_status_history" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "applicationId" uuid NOT NULL,
        "status" varchar(20) NOT NULL,
        "note" varchar(255),
        "changedById" uuid,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_application_status_history_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_application_status_history_applicationId" ON "application_status_history" ("applicationId")`,
    );
    await queryRunner.query(`
      ALTER TABLE "application_status_history"
      ADD CONSTRAINT "FK_application_status_history_application" FOREIGN KEY ("applicationId")
      REFERENCES "applications" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "application_status_history" DROP CONSTRAINT "FK_application_status_history_application"`,
    );
    await queryRunner.query(`DROP TABLE "application_status_history"`);

    await queryRunner.query(
      `ALTER TABLE "candidate_profiles" DROP CONSTRAINT "FK_candidate_profiles_user"`,
    );
    await queryRunner.query(`DROP TABLE "candidate_profiles"`);
  }
}
