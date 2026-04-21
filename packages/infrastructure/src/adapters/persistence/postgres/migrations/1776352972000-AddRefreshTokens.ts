import { MigrationInterface, QueryRunner } from "typeorm";

export class AddRefreshTokens1776352972000 implements MigrationInterface {
    name = 'AddRefreshTokens1776352972000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "refresh_tokens" (
                "id" uuid NOT NULL,
                "user_id" uuid NOT NULL,
                "token_hash" character varying(128) NOT NULL,
                "expires_at" TIMESTAMP NOT NULL,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "revoked_at" TIMESTAMP,
                "replaced_by_token_id" uuid,
                "user_agent" character varying(512),
                "ip_address" character varying(45),
                CONSTRAINT "PK_refresh_tokens" PRIMARY KEY ("id"),
                CONSTRAINT "UQ_refresh_tokens_token_hash" UNIQUE ("token_hash"),
                CONSTRAINT "FK_refresh_tokens_user" FOREIGN KEY ("user_id")
                    REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `);
        await queryRunner.query(`CREATE INDEX "IDX_refresh_tokens_user_id" ON "refresh_tokens" ("user_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_refresh_tokens_expires_at" ON "refresh_tokens" ("expires_at")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_refresh_tokens_expires_at"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_refresh_tokens_user_id"`);
        await queryRunner.query(`DROP TABLE "refresh_tokens"`);
    }
}
