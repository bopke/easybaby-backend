import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddIndexesToEntities1764429021300 implements MigrationInterface {
  name = 'AddIndexesToEntities1764429021300';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX "IDX_5ccb4291b315933604d4833a38" ON "trainers" ("name") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_aa2b96888cb22c931929b378a6" ON "trainers" ("voivodeship") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_7ab52b13eb9069c37a9e40a775" ON "trainers" ("city") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_56b91d98f71e3d1b649ed6e9f3" ON "refresh_tokens" ("expiresAt") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_56b91d98f71e3d1b649ed6e9f3"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_7ab52b13eb9069c37a9e40a775"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_aa2b96888cb22c931929b378a6"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_5ccb4291b315933604d4833a38"`,
    );
  }
}
