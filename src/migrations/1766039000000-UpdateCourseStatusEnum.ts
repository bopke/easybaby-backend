import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateCourseStatusEnum1766039000000 implements MigrationInterface {
  name = 'UpdateCourseStatusEnum1766039000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Step 1: Drop the default value constraint
    await queryRunner.query(`
      ALTER TABLE "courses"
      ALTER COLUMN "status" DROP DEFAULT
    `);

    // Step 2: Alter the column to TEXT type temporarily
    await queryRunner.query(`
      ALTER TABLE "courses"
      ALTER COLUMN "status" TYPE TEXT
    `);

    // Step 3: Update existing data: map old values to new values
    await queryRunner.query(`
      UPDATE "courses"
      SET "status" = CASE
        WHEN "status" = 'published' THEN 'open'
        WHEN "status" = 'completed' THEN 'cancelled'
        ELSE "status"
      END
    `);

    // Step 4: Create a new enum type with the updated values
    await queryRunner.query(
      `CREATE TYPE "public"."courses_status_enum_new" AS ENUM('draft', 'open', 'full', 'cancelled')`,
    );

    // Step 5: Alter the column to use the new enum type
    await queryRunner.query(`
      ALTER TABLE "courses"
      ALTER COLUMN "status" TYPE "public"."courses_status_enum_new"
      USING "status"::"public"."courses_status_enum_new"
    `);

    // Step 6: Drop the old enum type
    await queryRunner.query(`DROP TYPE "public"."courses_status_enum"`);

    // Step 7: Rename the new enum type to the old name
    await queryRunner.query(
      `ALTER TYPE "public"."courses_status_enum_new" RENAME TO "courses_status_enum"`,
    );

    // Step 8: Set the default value back
    await queryRunner.query(`
      ALTER TABLE "courses"
      ALTER COLUMN "status" SET DEFAULT 'draft'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Step 1: Drop the default value constraint
    await queryRunner.query(`
      ALTER TABLE "courses"
      ALTER COLUMN "status" DROP DEFAULT
    `);

    // Step 2: Alter the column to TEXT type temporarily
    await queryRunner.query(`
      ALTER TABLE "courses"
      ALTER COLUMN "status" TYPE TEXT
    `);

    // Step 3: Revert data mapping
    await queryRunner.query(`
      UPDATE "courses"
      SET "status" = CASE
        WHEN "status" = 'open' THEN 'published'
        WHEN "status" = 'full' THEN 'published'
        ELSE "status"
      END
    `);

    // Step 4: Create the old enum type
    await queryRunner.query(
      `CREATE TYPE "public"."courses_status_enum_new" AS ENUM('draft', 'published', 'cancelled', 'completed')`,
    );

    // Step 5: Alter the column to use the old enum type
    await queryRunner.query(`
      ALTER TABLE "courses"
      ALTER COLUMN "status" TYPE "public"."courses_status_enum_new"
      USING "status"::"public"."courses_status_enum_new"
    `);

    // Step 6: Drop the current enum type
    await queryRunner.query(`DROP TYPE "public"."courses_status_enum"`);

    // Step 7: Rename the new enum type to the old name
    await queryRunner.query(
      `ALTER TYPE "public"."courses_status_enum_new" RENAME TO "courses_status_enum"`,
    );

    // Step 8: Set the default value back
    await queryRunner.query(`
      ALTER TABLE "courses"
      ALTER COLUMN "status" SET DEFAULT 'draft'
    `);
  }
}
