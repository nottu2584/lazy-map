import { Entity, Column, PrimaryColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

/**
 * TypeORM entity for oauth_tokens table
 */
@Entity('oauth_tokens')
@Index(['userId', 'provider'], { unique: true })
@Index(['userId'])
@Index(['expiresAt'])
@Index(['provider'])
export class OAuthTokenEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column('uuid', { name: 'user_id' })
  userId!: string;

  @Column('varchar', { length: 50 })
  provider!: string;

  @Column('text', { name: 'access_token' })
  accessToken!: string;

  @Column('text', { name: 'refresh_token', nullable: true })
  refreshToken!: string | null;

  @Column('varchar', { length: 50, name: 'token_type', default: 'Bearer' })
  tokenType!: string;

  @Column('timestamp', { name: 'expires_at' })
  expiresAt!: Date;

  @Column('text', { nullable: true })
  scope!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
