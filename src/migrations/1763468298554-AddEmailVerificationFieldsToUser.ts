import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEmailVerificationFieldsToUser1763468298554 implements MigrationInterface {
  name = 'AddEmailVerificationFieldsToUser1763468298554';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD "emailVerificationCode" character varying NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "isEmailVerified" boolean NOT NULL DEFAULT false`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "isEmailVerified"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "emailVerificationCode"`,
    );
  }
}
