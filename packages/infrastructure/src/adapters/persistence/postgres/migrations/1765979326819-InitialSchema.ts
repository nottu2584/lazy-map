import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1765979326819 implements MigrationInterface {
    name = 'InitialSchema1765979326819'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying(255) NOT NULL, "username" character varying(100) NOT NULL, "passwordHash" character varying(255), "role" character varying(50) NOT NULL DEFAULT 'user', "status" character varying(50) NOT NULL DEFAULT 'active', "authProvider" character varying(50) NOT NULL DEFAULT 'local', "googleId" character varying(255), "discordId" character varying(255), "profilePicture" text, "emailVerified" boolean NOT NULL DEFAULT false, "preferences" jsonb, "subscriptionTier" character varying(50) NOT NULL DEFAULT 'free', "mapGenerationLimit" integer NOT NULL DEFAULT '10', "mapsGeneratedThisMonth" integer NOT NULL DEFAULT '0', "lastMapGeneratedAt" TIMESTAMP, "lastLoginAt" TIMESTAMP, "suspendedAt" TIMESTAMP, "suspendedBy" uuid, "suspensionReason" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "UQ_fe0bb3f6520ee0469504521e710" UNIQUE ("username"), CONSTRAINT "UQ_f382af58ab36057334fb262efd5" UNIQUE ("googleId"), CONSTRAINT "UQ_ae4a93a6b25195ccc2a97e13f0d" UNIQUE ("discordId"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_97672ac88f789774dd47f7c8be" ON "users" ("email") `);
        await queryRunner.query(`CREATE INDEX "IDX_fe0bb3f6520ee0469504521e71" ON "users" ("username") `);
        await queryRunner.query(`CREATE INDEX "IDX_f382af58ab36057334fb262efd" ON "users" ("googleId") `);
        await queryRunner.query(`CREATE INDEX "IDX_ae4a93a6b25195ccc2a97e13f0" ON "users" ("discordId") `);
        await queryRunner.query(`CREATE TABLE "maps" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "seed" character varying(255) NOT NULL, "name" character varying(255) NOT NULL, "description" text, "settings" jsonb NOT NULL, "userId" uuid NOT NULL, "isPublic" boolean NOT NULL DEFAULT false, "isFavorite" boolean NOT NULL DEFAULT false, "category" character varying(50), "tags" text array, "viewCount" integer NOT NULL DEFAULT '0', "downloadCount" integer NOT NULL DEFAULT '0', "lastAccessedAt" TIMESTAMP, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_dddaabaf432b881f9f6e13bf9bd" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_0af587e66f02b06dd5da4edea4" ON "maps" ("seed") `);
        await queryRunner.query(`CREATE INDEX "IDX_704b12c434d5e109b1f3643c0c" ON "maps" ("userId") `);
        await queryRunner.query(`CREATE INDEX "IDX_1fb0b667ce133dfa6908069bc0" ON "maps" ("category") `);
        await queryRunner.query(`CREATE TABLE "map_history" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "mapId" uuid NOT NULL, "action" character varying(50) NOT NULL, "metadata" jsonb, "sessionId" character varying(255), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_a6a28c1511f38e54efe8af5bc0f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_8c4db2c4319a6b777a2efffc0e" ON "map_history" ("userId") `);
        await queryRunner.query(`CREATE INDEX "IDX_8fbc46feaa7364168eaaa57455" ON "map_history" ("mapId") `);
        await queryRunner.query(`CREATE INDEX "IDX_a47c66919a784878c60688ad2f" ON "map_history" ("action") `);
        await queryRunner.query(`CREATE INDEX "IDX_6af2b86d95ff8d221b2c24017b" ON "map_history" ("createdAt") `);
        await queryRunner.query(`CREATE TABLE "oauth_tokens" ("id" uuid NOT NULL, "user_id" uuid NOT NULL, "provider" character varying(50) NOT NULL, "access_token" text NOT NULL, "refresh_token" text, "token_type" character varying(50) NOT NULL DEFAULT 'Bearer', "expires_at" TIMESTAMP NOT NULL, "scope" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_71c8b8060826696206f973554fd" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_6507aa2813ed9bd3a27662d783" ON "oauth_tokens" ("provider") `);
        await queryRunner.query(`CREATE INDEX "IDX_0dc2957a47ec8c4830ee913a2d" ON "oauth_tokens" ("expires_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_3e1f029633b2bfa8d72911be21" ON "oauth_tokens" ("user_id") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_586df1763219baae354ff29ed6" ON "oauth_tokens" ("user_id", "provider") `);
        await queryRunner.query(`ALTER TABLE "maps" ADD CONSTRAINT "FK_704b12c434d5e109b1f3643c0c2" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "map_history" ADD CONSTRAINT "FK_8c4db2c4319a6b777a2efffc0e8" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "map_history" ADD CONSTRAINT "FK_8fbc46feaa7364168eaaa574553" FOREIGN KEY ("mapId") REFERENCES "maps"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "map_history" DROP CONSTRAINT "FK_8fbc46feaa7364168eaaa574553"`);
        await queryRunner.query(`ALTER TABLE "map_history" DROP CONSTRAINT "FK_8c4db2c4319a6b777a2efffc0e8"`);
        await queryRunner.query(`ALTER TABLE "maps" DROP CONSTRAINT "FK_704b12c434d5e109b1f3643c0c2"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_586df1763219baae354ff29ed6"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_3e1f029633b2bfa8d72911be21"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_0dc2957a47ec8c4830ee913a2d"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_6507aa2813ed9bd3a27662d783"`);
        await queryRunner.query(`DROP TABLE "oauth_tokens"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_6af2b86d95ff8d221b2c24017b"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_a47c66919a784878c60688ad2f"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_8fbc46feaa7364168eaaa57455"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_8c4db2c4319a6b777a2efffc0e"`);
        await queryRunner.query(`DROP TABLE "map_history"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_1fb0b667ce133dfa6908069bc0"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_704b12c434d5e109b1f3643c0c"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_0af587e66f02b06dd5da4edea4"`);
        await queryRunner.query(`DROP TABLE "maps"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ae4a93a6b25195ccc2a97e13f0"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_f382af58ab36057334fb262efd"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_fe0bb3f6520ee0469504521e71"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_97672ac88f789774dd47f7c8be"`);
        await queryRunner.query(`DROP TABLE "users"`);
    }

}
