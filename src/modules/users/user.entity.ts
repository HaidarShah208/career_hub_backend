import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserRole } from '../../shared/constants';
import { Company } from '../companies/company.entity';
import { Application } from '../applications/application.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  firstName: string;

  @Column({ type: 'varchar', length: 100 })
  lastName: string;

  @Index('IDX_users_email', { unique: true })
  @Column({ type: 'varchar', length: 255 })
  email: string;

  // `select: false` keeps the hash out of every default query result.
  @Column({ type: 'varchar', length: 255, select: false })
  password: string;

  @Column({ type: 'varchar', length: 20, default: UserRole.CANDIDATE })
  role: UserRole;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @OneToMany(() => Company, (company) => company.owner)
  companies?: Company[];

  @OneToMany(() => Application, (application) => application.candidate)
  applications?: Application[];

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  get fullName(): string {
    return `${this.firstName} ${this.lastName}`.trim();
  }
}
