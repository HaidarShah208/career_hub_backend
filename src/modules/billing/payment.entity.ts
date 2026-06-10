import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PaymentMethod, PaymentStatus } from '../../shared/constants';
import { User } from '../users/user.entity';
import { Plan } from './plan.entity';
import { Subscription } from './subscription.entity';

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('IDX_payments_employerId')
  @Column({ type: 'uuid' })
  employerId: string;

  @Column({ type: 'uuid', nullable: true })
  subscriptionId?: string | null;

  @Column({ type: 'uuid', nullable: true })
  planId?: string | null;

  @Column({ type: 'int' })
  amount: number;

  @Column({ type: 'varchar', length: 3, default: 'PKR' })
  currency: string;

  @Column({ type: 'varchar', length: 30 })
  paymentMethod: PaymentMethod;

  @Column({ type: 'varchar', length: 255, nullable: true })
  transactionReference?: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  gatewayTransactionId?: string | null;

  @Column({ type: 'varchar', length: 512, nullable: true })
  screenshotUrl?: string | null;

  @Column({ type: 'varchar', length: 30, default: PaymentStatus.PENDING })
  status: PaymentStatus;

  @Column({ type: 'timestamp', nullable: true })
  paidAt?: Date | null;

  @Column({ type: 'uuid', nullable: true })
  verifiedBy?: string | null;

  @Column({ type: 'timestamp', nullable: true })
  verificationDate?: Date | null;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'employerId' })
  employer: User;

  @ManyToOne(() => Subscription, (sub) => sub.payments, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'subscriptionId' })
  subscription?: Subscription | null;

  @ManyToOne(() => Plan, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'planId' })
  plan?: Plan | null;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}
