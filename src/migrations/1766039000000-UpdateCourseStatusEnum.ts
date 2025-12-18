import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateCourseStatusEnum1766039000000 implements MigrationInterface {
  name = 'UpdateCourseStatusEnum1766039000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create a new enum type with the updated values
    await queryRunner.query(
      `CREATE TYPE "public"."courses_status_enum_new" AS ENUM('draft', 'open', 'full', 'cancelled')`,
    );

    // Update existing data: map old values to new values
    // published -> open (assuming published courses should be open)
    // completed -> cancelled (or we could keep them, but let's map to cancelled for now)
    await queryRunner.query(`
      UPDATE "courses"
      SET "status" = CASE
        WHEN "status" = 'published' THEN 'open'
        WHEN "status" = 'completed' THEN 'cancelled'
        ELSE "status"::text
      END::text
    `);

    await queryRunner.query(`
      ALTER TABLE "courses"
      ALTER COLUMN "status" TYPE "public"."courses_status_enum_new"
      USING "status"::text::"public"."courses_status_enum_new"
    `);

    await queryRunner.query(`
      ALTER TABLE "courses"
      ALTER COLUMN "status" SET DEFAULT 'draft'
    `);

    // Drop the old enum type
    await queryRunner.query(`DROP TYPE "public"."courses_status_enum"`);

    // Rename the new enum type to the old name
    await queryRunner.query(
      `ALTER TYPE "public"."courses_status_enum_new" RENAME TO "courses_status_enum"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Create the old enum type
    await queryRunner.query(
      `CREATE TYPE "public"."courses_status_enum_new" AS ENUM('draft', 'published', 'cancelled', 'completed')`,
    );

    // Revert data mapping
    await queryRunner.query(`
      UPDATE "courses"
      SET "status" = CASE
        WHEN "status" = 'open' THEN 'published'
        WHEN "status" = 'full' THEN 'published'
        ELSE "status"::text
      END::text
    `);

    // Alter the column to use the old enum type
    await queryRunner.query(`
      ALTER TABLE "courses"
      ALTER COLUMN "status" TYPE "public"."courses_status_enum_new"
      USING "status"::text::"public"."courses_status_enum_new"
    `);

    // Set the default value
    await queryRunner.query(`
      ALTER TABLE "courses"
      ALTER COLUMN "status" SET DEFAULT 'draft'
    `);

    // Drop the current enum type
    await queryRunner.query(`DROP TYPE "public"."courses_status_enum"`);

    // Rename the new enum type to the old name
    await queryRunner.query(
      `ALTER TYPE "public"."courses_status_enum_new" RENAME TO "courses_status_enum"`,
    );
  }
}
