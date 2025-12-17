import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index, ManyToOne, JoinColumn } from 'typeorm';
import { UserEntity } from './UserEntity';

/**
 * MapEntity stores only the generation parameters for maps.
 * The actual map can be regenerated deterministically from these parameters.
 * This is a pure data structure - validation happens in the domain layer.
 */
@Entity('maps')
export class MapEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  @Index()
  seed!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @Column({ type: 'jsonb' })
  settings!: {
    dimensions: {
      width: number;
      height: number;
    };
    terrain: {
      type: string;
      elevation: {
        min: number;
        max: number;
      };
    };
    features: {
      forests?: {
        enabled: boolean;
        density: number;
      };
      rivers?: {
        enabled: boolean;
        count: number;
      };
      buildings?: {
        enabled: boolean;
        density: number;
      };
      roads?: {
        enabled: boolean;
        connectedness: number;
      };
    };
    generation: {
      algorithm: string;
      noiseScale?: number;
      octaves?: number;
    };
  };

  @Column()
  @Index()
  userId!: string;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'userId' })
  user?: UserEntity;

  @Column({ type: 'boolean', default: false })
  isPublic!: boolean;

  @Column({ type: 'boolean', default: false })
  isFavorite!: boolean;

  @Column({ type: 'varchar', length: 50, nullable: true })
  @Index()
  category?: string | null;

  @Column({ type: 'text', array: true, nullable: true })
  tags?: string[] | null;

  @Column({ type: 'int', default: 0 })
  viewCount!: number;

  @Column({ type: 'int', default: 0 })
  downloadCount!: number;

  @Column({ type: 'timestamp', nullable: true })
  lastAccessedAt?: Date | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  constructor(partial: Partial<MapEntity> = {}) {
    Object.assign(this, partial);
  }
}