import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EmploymentType, JobStatus } from '../../shared/constants';
import { Company } from '../companies/company.entity';
import { Application } from '../applications/application.entity';

@Entity('jobs')
export class Job {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('IDX_jobs_title')
  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Index('IDX_jobs_slug', { unique: true })
  @Column({ type: 'varchar', length: 280 })
  slug: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  location?: string | null;

  @Column({ type: 'varchar', length: 30, default: EmploymentType.FULL_TIME })
  employmentType: EmploymentType;

  @Column({ type: 'int', nullable: true })
  salaryMin?: number | null;

  @Column({ type: 'int', nullable: true })
  salaryMax?: number | null;

  @Column({ type: 'varchar', length: 60, nullable: true })
  category?: string | null;

  @Column({ type: 'varchar', length: 30, nullable: true })
  experienceLevel?: string | null;

  // Stored as a comma-separated list (TypeORM simple-array).
  @Column({ type: 'simple-array', nullable: true })
  skills?: string[] | null;

  // How candidates apply: 'internal' (apply on platform) or 'external' (redirect).
  @Column({ type: 'varchar', length: 20, default: 'internal' })
  applyMethod: string;

  @Column({ type: 'varchar', length: 512, nullable: true })
  applyUrl?: string | null;

  @Column({ type: 'boolean', default: false })
  isUrgent: boolean;

  @Column({ type: 'boolean', default: false })
  isFeatured: boolean;

  @Column({ type: 'int', default: 0 })
  viewCount: number;

  @Index('IDX_jobs_status')
  @Column({ type: 'varchar', length: 20, default: JobStatus.PUBLISHED })
  status: JobStatus;

  @Index('IDX_jobs_companyId')
  @Column({ type: 'uuid' })
  companyId: string;

  @ManyToOne(() => Company, (company) => company.jobs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'companyId' })
  company: Company;

  @OneToMany(() => Application, (application) => application.job)
  applications?: Application[];

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}
