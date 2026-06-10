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
import { SubscriptionStatus } from '../../shared/constants';
import { User } from '../users/user.entity';
import { Payment } from './payment.entity';
import { Plan } from './plan.entity';

@Entity('subscriptions')
export class Subscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('IDX_subscriptions_employerId')
  @Column({ type: 'uuid' })
  employerId: string;

  @Column({ type: 'uuid' })
  planId: string;

  @Column({ type: 'uuid', nullable: true })
  pendingPlanId?: string | null;

  @Column({ type: 'timestamp', nullable: true })
  startDate?: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  endDate?: Date | null;

  @Column({ type: 'varchar', length: 30, default: SubscriptionStatus.PENDING_PAYMENT })
  status: SubscriptionStatus;

  @Column({ type: 'boolean', default: true })
  autoRenew: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true })
  stripeCustomerId?: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  stripeSubscriptionId?: string | null;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'employerId' })
  employer: User;

  @ManyToOne(() => Plan, (plan) => plan.subscriptions, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'planId' })
  plan: Plan;

  @ManyToOne(() => Plan, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'pendingPlanId' })
  pendingPlan?: Plan | null;

  @OneToMany(() => Payment, (payment) => payment.subscription)
  payments?: Payment[];

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}
