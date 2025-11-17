import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTrainersTable1763349936058 implements MigrationInterface {
  name = 'CreateTrainersTable1763349936058';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "trainers" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "level" character varying NOT NULL, "voivodeship" character varying NOT NULL, "city" character varying NOT NULL, "email" character varying NOT NULL, "site" character varying, "phone" character varying, "additionalOffer" text, "expirationDate" date, "notes" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_198da56395c269936d351ab774b" PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "trainers"`);
  }
}
