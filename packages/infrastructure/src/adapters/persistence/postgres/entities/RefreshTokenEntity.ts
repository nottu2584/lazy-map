import { Entity, Column, PrimaryColumn, CreateDateColumn, Index } from 'typeorm';

/**
 * TypeORM entity for refresh_tokens table
 */
@Entity('refresh_tokens')
@Index(['userId'])
@Index(['expiresAt'])
export class RefreshTokenEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column('uuid', { name: 'user_id' })
  userId!: string;

  @Column('varchar', { length: 128, name: 'token_hash', unique: true })
  tokenHash!: string;

  @Column('timestamp', { name: 'expires_at' })
  expiresAt!: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @Column('timestamp', { name: 'revoked_at', nullable: true })
  revokedAt!: Date | null;

  @Column('uuid', { name: 'replaced_by_token_id', nullable: true })
  replacedByTokenId!: string | null;

  @Column('varchar', { length: 512, name: 'user_agent', nullable: true })
  userAgent!: string | null;

  @Column('varchar', { length: 45, name: 'ip_address', nullable: true })
  ipAddress!: string | null;
}
