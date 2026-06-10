import { Repository } from 'typeorm';
import { AppDataSource } from '../../config/database';
import { PaymentStatus } from '../../shared/constants';
import { Payment } from './payment.entity';

export class PaymentsRepository {
  private get repo(): Repository<Payment> {
    return AppDataSource.getRepository(Payment);
  }

  findById(id: string): Promise<Payment | null> {
    return this.repo.findOne({
      where: { id },
      relations: { plan: true, subscription: true, employer: true },
    });
  }

  findPendingVerification(): Promise<Payment[]> {
    return this.repo.find({
      where: { status: PaymentStatus.PENDING },
      relations: { plan: true, employer: true, subscription: true },
      order: { createdAt: 'DESC' },
    });
  }

  findByEmployer(employerId: string, limit = 20): Promise<Payment[]> {
    return this.repo.find({
      where: { employerId },
      relations: { plan: true },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  findAllRecent(limit = 50): Promise<Payment[]> {
    return this.repo.find({
      relations: { plan: true, employer: true },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  findSuccessful(limit = 200): Promise<Payment[]> {
    return this.repo.find({
      where: { status: PaymentStatus.SUCCESS },
      relations: { plan: true, employer: true },
      order: { paidAt: 'DESC' },
      take: limit,
    });
  }

  countSuccessfulSince(since: Date): Promise<number> {
    return this.repo
      .createQueryBuilder('p')
      .where('p.status = :status', { status: PaymentStatus.SUCCESS })
      .andWhere('p.paidAt >= :since', { since })
      .getCount();
  }

  sumSuccessfulSince(since: Date): Promise<number> {
    return this.repo
      .createQueryBuilder('p')
      .select('COALESCE(SUM(p.amount), 0)', 'total')
      .where('p.status = :status', { status: PaymentStatus.SUCCESS })
      .andWhere('p.paidAt >= :since', { since })
      .getRawOne()
      .then((r) => Number(r?.total ?? 0));
  }

  create(data: Partial<Payment>): Payment {
    return this.repo.create(data);
  }

  save(payment: Payment): Promise<Payment> {
    return this.repo.save(payment);
  }
}

export const paymentsRepository = new PaymentsRepository();
