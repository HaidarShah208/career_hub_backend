import { MigrationInterface, QueryRunner } from 'typeorm';

/** Phase 10: subscription plans, payments, employer billing status. */
export class Phase10Billing1700000008000 implements MigrationInterface {
  name = 'Phase10Billing1700000008000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "plans" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" varchar(100) NOT NULL,
        "slug" varchar(100) NOT NULL,
        "description" text,
        "price" integer NOT NULL,
        "currency" varchar(3) NOT NULL DEFAULT 'PKR',
        "billingCycle" varchar(20) NOT NULL DEFAULT 'MONTHLY',
        "jobLimit" integer,
        "applicationLimit" integer,
        "featuredJobsLimit" integer,
        "recruiterSeats" integer,
        "resumeViews" integer,
        "prioritySupport" boolean NOT NULL DEFAULT false,
        "isPopular" boolean NOT NULL DEFAULT false,
        "isActive" boolean NOT NULL DEFAULT true,
        "stripePriceId" varchar(255),
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_plans" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_plans_slug" UNIQUE ("slug")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "subscriptions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "employerId" uuid NOT NULL,
        "planId" uuid NOT NULL,
        "pendingPlanId" uuid,
        "startDate" TIMESTAMP,
        "endDate" TIMESTAMP,
        "status" varchar(30) NOT NULL DEFAULT 'PENDING_PAYMENT',
        "autoRenew" boolean NOT NULL DEFAULT true,
        "stripeCustomerId" varchar(255),
        "stripeSubscriptionId" varchar(255),
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_subscriptions" PRIMARY KEY ("id"),
        CONSTRAINT "FK_subscriptions_employer" FOREIGN KEY ("employerId") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_subscriptions_plan" FOREIGN KEY ("planId") REFERENCES "plans"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_subscriptions_pending_plan" FOREIGN KEY ("pendingPlanId") REFERENCES "plans"("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_subscriptions_employerId" ON "subscriptions" ("employerId")`,
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "payments" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "employerId" uuid NOT NULL,
        "subscriptionId" uuid,
        "planId" uuid,
        "amount" integer NOT NULL,
        "currency" varchar(3) NOT NULL DEFAULT 'PKR',
        "paymentMethod" varchar(30) NOT NULL,
        "transactionReference" varchar(255),
        "gatewayTransactionId" varchar(255),
        "screenshotUrl" varchar(512),
        "status" varchar(30) NOT NULL DEFAULT 'PENDING',
        "paidAt" TIMESTAMP,
        "verifiedBy" uuid,
        "verificationDate" TIMESTAMP,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_payments" PRIMARY KEY ("id"),
        CONSTRAINT "FK_payments_employer" FOREIGN KEY ("employerId") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_payments_subscription" FOREIGN KEY ("subscriptionId") REFERENCES "subscriptions"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_payments_plan" FOREIGN KEY ("planId") REFERENCES "plans"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_payments_verifiedBy" FOREIGN KEY ("verifiedBy") REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_payments_employerId" ON "payments" ("employerId")`,
    );

    await queryRunner.query(
      `ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "employerStatus" varchar(20) NOT NULL DEFAULT 'PENDING'`,
    );
    await queryRunner.query(
      `ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "verificationDocuments" text`,
    );
    await queryRunner.query(`
      UPDATE "companies"
      SET "employerStatus" = CASE WHEN "isVerified" = true THEN 'APPROVED' ELSE 'PENDING' END
      WHERE "employerStatus" = 'PENDING'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "companies" DROP COLUMN IF EXISTS "verificationDocuments"`);
    await queryRunner.query(`ALTER TABLE "companies" DROP COLUMN IF EXISTS "employerStatus"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "payments"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "subscriptions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "plans"`);
  }
}
