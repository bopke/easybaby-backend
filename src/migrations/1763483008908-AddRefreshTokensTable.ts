import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRefreshTokensTable1763483008908 implements MigrationInterface {
  name = 'AddRefreshTokensTable1763483008908';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "refresh_tokens" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "jti" character varying NOT NULL, "userId" uuid NOT NULL, "expiresAt" TIMESTAMP NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "lastUsedAt" TIMESTAMP, "ipAddress" character varying(45), "userAgent" text, "isRevoked" boolean NOT NULL DEFAULT false, "tokenFamily" character varying, CONSTRAINT "UQ_f3752400c98d5c0b3dca54d66d5" UNIQUE ("jti"), CONSTRAINT "PK_7d8bee0204106019488c4c50ffa" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_f3752400c98d5c0b3dca54d66d" ON "refresh_tokens" ("jti") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_610102b60fea1455310ccd299d" ON "refresh_tokens" ("userId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_93d50353ef8c9b9b1ca2421a17" ON "refresh_tokens" ("isRevoked") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_26f0a476215a16a8729fb0a054" ON "refresh_tokens" ("tokenFamily") `,
    );
    await queryRunner.query(
      `ALTER TABLE "refresh_tokens" ADD CONSTRAINT "FK_610102b60fea1455310ccd299de" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "refresh_tokens" DROP CONSTRAINT "FK_610102b60fea1455310ccd299de"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_26f0a476215a16a8729fb0a054"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_93d50353ef8c9b9b1ca2421a17"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_610102b60fea1455310ccd299d"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_f3752400c98d5c0b3dca54d66d"`,
    );
    await queryRunner.query(`DROP TABLE "refresh_tokens"`);
  }
}
