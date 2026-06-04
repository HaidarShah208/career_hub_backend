import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../users/user.entity';

@Entity('candidate_profiles')
export class CandidateProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // One profile per user.
  @Index('IDX_candidate_profiles_userId', { unique: true })
  @Column({ type: 'uuid' })
  userId: string;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'varchar', length: 160, nullable: true })
  headline?: string | null;

  @Column({ type: 'text', nullable: true })
  bio?: string | null;

  // Stored as a comma-separated list (TypeORM simple-array).
  @Column({ type: 'simple-array', nullable: true })
  skills?: string[] | null;

  @Column({ type: 'int', default: 0 })
  experienceYears: number;

  @Column({ type: 'varchar', length: 120, nullable: true })
  city?: string | null;

  @Column({ type: 'varchar', length: 512, nullable: true })
  avatarUrl?: string | null;

  @Column({ type: 'varchar', length: 512, nullable: true })
  resumeUrl?: string | null;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}
