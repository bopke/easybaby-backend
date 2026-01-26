import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddImageUrlToEntities1766100000000 implements MigrationInterface {
  name = 'AddImageUrlToEntities1766100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "trainers" ADD "imageUrl" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "articles" ADD "imageUrl" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "imageUrl" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "imageUrl"`);
    await queryRunner.query(`ALTER TABLE "articles" DROP COLUMN "imageUrl"`);
    await queryRunner.query(`ALTER TABLE "trainers" DROP COLUMN "imageUrl"`);
  }
}
