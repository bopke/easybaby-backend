import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateTrainerEntity1763400447653 implements MigrationInterface {
  name = 'UpdateTrainerEntity1763400447653';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "trainers" DROP COLUMN "level"`);
    await queryRunner.query(
      `ALTER TABLE "trainers" DROP COLUMN "expirationDate"`,
    );
    await queryRunner.query(
      `ALTER TABLE "trainers" ADD "isVerified" boolean NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "trainers" DROP COLUMN "additionalOffer"`,
    );
    await queryRunner.query(
      `ALTER TABLE "trainers" ADD "additionalOffer" character varying`,
    );
    await queryRunner.query(`ALTER TABLE "trainers" DROP COLUMN "notes"`);
    await queryRunner.query(
      `ALTER TABLE "trainers" ADD "notes" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "trainers" DROP COLUMN "notes"`);
    await queryRunner.query(`ALTER TABLE "trainers" ADD "notes" text`);
    await queryRunner.query(
      `ALTER TABLE "trainers" DROP COLUMN "additionalOffer"`,
    );
    await queryRunner.query(
      `ALTER TABLE "trainers" ADD "additionalOffer" text`,
    );
    await queryRunner.query(`ALTER TABLE "trainers" DROP COLUMN "isVerified"`);
    await queryRunner.query(`ALTER TABLE "trainers" ADD "expirationDate" date`);
    await queryRunner.query(
      `ALTER TABLE "trainers" ADD "level" character varying NOT NULL`,
    );
  }
}
