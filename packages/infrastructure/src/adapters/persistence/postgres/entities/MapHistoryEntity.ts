import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index, ManyToOne, JoinColumn } from 'typeorm';
import { UserEntity } from './UserEntity';
import { MapEntity } from './MapEntity';

/**
 * MapHistoryEntity tracks user interactions with maps.
 * Useful for analytics, recommendations, and user activity tracking.
 * This is a pure data structure - validation happens in the domain layer.
 */
@Entity('map_history')
export class MapHistoryEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  @Index()
  userId!: string;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'userId' })
  user?: UserEntity;

  @Column()
  @Index()
  mapId!: string;

  @ManyToOne(() => MapEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'mapId' })
  map?: MapEntity;

  @Column({ type: 'varchar', length: 50 })
  @Index()
  action!: 'generated' | 'viewed' | 'downloaded' | 'edited' | 'deleted' | 'shared';

  @Column({ type: 'jsonb', nullable: true })
  metadata?: {
    regenerationCount?: number;
    exportFormat?: string;
    shareMethod?: string;
    editedSettings?: Record<string, any>;
    sessionDuration?: number;
    clientInfo?: {
      ip?: string;
      userAgent?: string;
      platform?: string;
    };
  } | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  sessionId?: string | null;

  @CreateDateColumn()
  @Index()
  createdAt!: Date;

  constructor(partial: Partial<MapHistoryEntity> = {}) {
    Object.assign(this, partial);
  }
}