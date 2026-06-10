import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { BillingCycle } from '../../shared/constants';
import { Subscription } from './subscription.entity';

@Entity('plans')
export class Plan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Index('IDX_plans_slug', { unique: true })
  @Column({ type: 'varchar', length: 100 })
  slug: string;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @Column({ type: 'int' })
  price: number;

  @Column({ type: 'varchar', length: 3, default: 'PKR' })
  currency: string;

  @Column({ type: 'varchar', length: 20, default: BillingCycle.MONTHLY })
  billingCycle: BillingCycle;

  /** null = unlimited */
  @Column({ type: 'int', nullable: true })
  jobLimit?: number | null;

  @Column({ type: 'int', nullable: true })
  applicationLimit?: number | null;

  @Column({ type: 'int', nullable: true })
  featuredJobsLimit?: number | null;

  @Column({ type: 'int', nullable: true })
  recruiterSeats?: number | null;

  @Column({ type: 'int', nullable: true })
  resumeViews?: number | null;

  @Column({ type: 'boolean', default: false })
  prioritySupport: boolean;

  @Column({ type: 'boolean', default: false })
  isPopular: boolean;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true })
  stripePriceId?: string | null;

  @OneToMany(() => Subscription, (sub) => sub.plan)
  subscriptions?: Subscription[];

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}
