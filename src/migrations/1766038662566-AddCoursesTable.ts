import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCoursesTable1766038662566 implements MigrationInterface {
  name = 'AddCoursesTable1766038662566';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."courses_status_enum" AS ENUM('draft', 'published', 'cancelled', 'completed')`,
    );
    await queryRunner.query(
      `CREATE TABLE "courses" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "slug" character varying NOT NULL, "date" TIMESTAMP NOT NULL, "title" character varying NOT NULL, "description" text NOT NULL, "status" "public"."courses_status_enum" NOT NULL DEFAULT 'draft', "availableSpots" integer, "price" numeric(10,2) NOT NULL, "dateLabel" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_a3bb2d01cfa0f95bc5e034e1b7a" UNIQUE ("slug"), CONSTRAINT "PK_3f70a487cc718ad8eda4e6d58c9" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a3bb2d01cfa0f95bc5e034e1b7" ON "courses" ("slug") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_a3bb2d01cfa0f95bc5e034e1b7"`,
    );
    await queryRunner.query(`DROP TABLE "courses"`);
    await queryRunner.query(`DROP TYPE "public"."courses_status_enum"`);
  }
}
