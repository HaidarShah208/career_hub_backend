import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { ApplicationStatus } from '../../shared/constants';
import { CandidateProfile } from '../candidates/candidate-profile.entity';
import { User } from '../users/user.entity';
import { Job } from '../jobs/job.entity';
import { ApplicationStatusHistory } from './application-status-history.entity';

@Entity('applications')
// A candidate can only apply to a given job once.
@Unique('UQ_applications_candidate_job', ['candidateId', 'jobId'])
export class Application {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('IDX_applications_candidateId')
  @Column({ type: 'uuid' })
  candidateId: string;

  @Index('IDX_applications_jobId')
  @Column({ type: 'uuid' })
  jobId: string;

  @Column({ type: 'varchar', length: 20, default: ApplicationStatus.APPLIED })
  status: ApplicationStatus;

  @ManyToOne(() => User, (user) => user.applications, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'candidateId' })
  candidate: User;

  /** Populated via query join — not a DB column. */
  candidateProfile?: CandidateProfile;

  @ManyToOne(() => Job, (job) => job.applications, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'jobId' })
  job: Job;

  @OneToMany(() => ApplicationStatusHistory, (history) => history.application)
  history?: ApplicationStatusHistory[];

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}
