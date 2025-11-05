import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration to simplify user roles from 3 to 2 roles
 * Converts SUPER_ADMIN to ADMIN, keeping USER as-is
 */
export class SimplifyUserRoles1736000000000 implements MigrationInterface {
  name = 'SimplifyUserRoles1736000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // First, update any SUPER_ADMIN roles to ADMIN
    await queryRunner.query(`
      UPDATE "user"
      SET role = 'ADMIN'
      WHERE role = 'SUPER_ADMIN'
    `);

    // Drop the old enum type if it exists and create a new one
    // PostgreSQL doesn't allow altering enum types directly
    await queryRunner.query(`
      -- Create new enum type with only USER and ADMIN
      CREATE TYPE "user_role_enum_new" AS ENUM('USER', 'ADMIN');

      -- Alter the column to use the new enum
      ALTER TABLE "user"
        ALTER COLUMN role TYPE "user_role_enum_new"
        USING role::text::"user_role_enum_new";

      -- Drop the old enum type
      DROP TYPE IF EXISTS "user_role_enum";

      -- Rename the new enum to the standard name
      ALTER TYPE "user_role_enum_new" RENAME TO "user_role_enum";
    `);

    // Add index on role column for better query performance
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_user_role" ON "user" ("role");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove the index
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_user_role";
    `);

    // Recreate the old enum with 3 values
    await queryRunner.query(`
      -- Create old enum type with USER, ADMIN, and SUPER_ADMIN
      CREATE TYPE "user_role_enum_old" AS ENUM('USER', 'ADMIN', 'SUPER_ADMIN');

      -- Alter the column to use the old enum
      ALTER TABLE "user"
        ALTER COLUMN role TYPE "user_role_enum_old"
        USING role::text::"user_role_enum_old";

      -- Drop the current enum type
      DROP TYPE IF EXISTS "user_role_enum";

      -- Rename the old enum back to the standard name
      ALTER TYPE "user_role_enum_old" RENAME TO "user_role_enum";
    `);

    // Note: We don't restore SUPER_ADMIN roles as we can't know which ADMINs were originally SUPER_ADMIN
    // This is acceptable as rollback would maintain all admins as ADMIN
  }
}