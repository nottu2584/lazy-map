import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

/**
 * UserEntity represents the database schema for user persistence.
 * This is a pure data structure - validation happens in the domain layer.
 * TypeORM decorators define database constraints, not business rules.
 */
@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  @Index()
  email!: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  @Index()
  username!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  passwordHash?: string | null;

  @Column({ type: 'varchar', length: 50, default: 'user' })
  role!: string;

  @Column({ type: 'varchar', length: 50, default: 'active' })
  status!: string;

  @Column({ type: 'varchar', length: 50, default: 'local' })
  authProvider!: string;

  @Column({ type: 'varchar', length: 255, nullable: true, unique: true })
  @Index()
  googleId?: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true, unique: true })
  @Index()
  discordId?: string | null;

  @Column({ type: 'text', nullable: true })
  profilePicture?: string | null;

  @Column({ type: 'boolean', default: false })
  emailVerified!: boolean;

  @Column({ type: 'jsonb', nullable: true })
  preferences?: Record<string, any> | null;

  @Column({ type: 'varchar', length: 50, default: 'free' })
  subscriptionTier!: string;

  @Column({ type: 'int', default: 10 })
  mapGenerationLimit!: number;

  @Column({ type: 'int', default: 0 })
  mapsGeneratedThisMonth!: number;

  @Column({ type: 'timestamp', nullable: true })
  lastMapGeneratedAt?: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  lastLoginAt?: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  suspendedAt?: Date | null;

  @Column({ type: 'uuid', nullable: true })
  suspendedBy?: string | null;

  @Column({ type: 'text', nullable: true })
  suspensionReason?: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  constructor(partial: Partial<UserEntity> = {}) {
    Object.assign(this, partial);
  }
}