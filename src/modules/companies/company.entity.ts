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
import { User } from '../users/user.entity';
import { Job } from '../jobs/job.entity';

@Entity('companies')
export class Company {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('IDX_companies_name')
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  website?: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  location?: string | null;

  @Column({ type: 'varchar', length: 512, nullable: true })
  logo?: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  industry?: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  companySize?: string | null;

  @Column({ type: 'int', nullable: true })
  foundedYear?: number | null;

  // A user (admin/employer) can own many companies (Company belongsTo User).
  @Index('IDX_companies_ownerId')
  @Column({ type: 'uuid' })
  ownerId: string;

  @ManyToOne(() => User, (user) => user.companies, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ownerId' })
  owner: User;

  @OneToMany(() => Job, (job) => job.company)
  jobs?: Job[];

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}
