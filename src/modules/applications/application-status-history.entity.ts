import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ApplicationStatus } from '../../shared/constants';
import { Application } from './application.entity';

/**
 * Immutable record of each status an application has moved through, forming
 * the application timeline (Applied -> Under Review -> Shortlisted -> ...).
 */
@Entity('application_status_history')
export class ApplicationStatusHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('IDX_application_status_history_applicationId')
  @Column({ type: 'uuid' })
  applicationId: string;

  @ManyToOne(() => Application, (application) => application.history, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'applicationId' })
  application: Application;

  @Column({ type: 'varchar', length: 20 })
  status: ApplicationStatus;

  @Column({ type: 'varchar', length: 255, nullable: true })
  note?: string | null;

  // The user (admin) who triggered the change; null for the initial APPLIED entry.
  @Column({ type: 'uuid', nullable: true })
  changedById?: string | null;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;
}
