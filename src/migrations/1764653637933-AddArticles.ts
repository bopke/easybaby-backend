import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddArticles1764653637933 implements MigrationInterface {
  name = 'AddArticles1764653637933';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "articles" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "slug" character varying NOT NULL, "metaTitle" character varying NOT NULL, "metaDescription" character varying NOT NULL, "header" character varying NOT NULL, "subheader" character varying NOT NULL, "contents" text NOT NULL, "author" character varying NOT NULL, "publishedDate" TIMESTAMP NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_1123ff6815c5b8fec0ba9fec370" UNIQUE ("slug"), CONSTRAINT "PK_0a6e2c450d83e0b6052c2793334" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_1123ff6815c5b8fec0ba9fec37" ON "articles" ("slug") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_79baa8f63b0876df6194e32642" ON "articles" ("author") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ff8741f92b8b2f1b393f9ad2ae" ON "articles" ("publishedDate") `,
    );
    await queryRunner.query(
      `CREATE TABLE "article_tags" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tag" character varying NOT NULL, "articleId" uuid NOT NULL, CONSTRAINT "PK_75f74d8cce8a559622dffcc5ae2" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "article_tags" ADD CONSTRAINT "FK_acbc7f775fb5e3fe2627477b5f7" FOREIGN KEY ("articleId") REFERENCES "articles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "article_tags" DROP CONSTRAINT "FK_acbc7f775fb5e3fe2627477b5f7"`,
    );
    await queryRunner.query(`DROP TABLE "article_tags"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ff8741f92b8b2f1b393f9ad2ae"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_79baa8f63b0876df6194e32642"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_1123ff6815c5b8fec0ba9fec37"`,
    );
    await queryRunner.query(`DROP TABLE "articles"`);
  }
}
