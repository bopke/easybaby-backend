import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEmailVerificationCodeExpires1764378133302
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "users"
            ADD COLUMN "emailVerificationCodeExpires" TIMESTAMP WITH TIME ZONE
        `);

    await queryRunner.query(`
            UPDATE "users"
            SET "emailVerificationCodeExpires" = NOW() + INTERVAL '24 hours'
            WHERE "isEmailVerified" = false
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "users"
            DROP COLUMN "emailVerificationCodeExpires"
        `);
  }
}
