import { Repository } from 'typeorm';
import { AppDataSource } from '../../config/database';
import { SubscriptionStatus } from '../../shared/constants';
import { Subscription } from './subscription.entity';

export class SubscriptionsRepository {
  private get repo(): Repository<Subscription> {
    return AppDataSource.getRepository(Subscription);
  }

  findById(id: string): Promise<Subscription | null> {
    return this.repo.findOne({
      where: { id },
      relations: { plan: true, pendingPlan: true, employer: true },
    });
  }

  findActiveByEmployerId(employerId: string): Promise<Subscription | null> {
    return this.repo.findOne({
      where: { employerId, status: SubscriptionStatus.ACTIVE },
      relations: { plan: true, pendingPlan: true },
      order: { createdAt: 'DESC' },
    });
  }

  findLatestByEmployerId(employerId: string): Promise<Subscription | null> {
    return this.repo.findOne({
      where: { employerId },
      relations: { plan: true, pendingPlan: true },
      order: { createdAt: 'DESC' },
    });
  }

  findExpiredCandidates(now: Date): Promise<Subscription[]> {
    return this.repo
      .createQueryBuilder('sub')
      .leftJoinAndSelect('sub.plan', 'plan')
      .where('sub.status = :status', { status: SubscriptionStatus.ACTIVE })
      .andWhere('sub.endDate IS NOT NULL')
      .andWhere('sub.endDate < :now', { now })
      .getMany();
  }

  findAllWithPlan(): Promise<Subscription[]> {
    return this.repo.find({ relations: { plan: true, employer: true }, order: { createdAt: 'DESC' } });
  }

  create(data: Partial<Subscription>): Subscription {
    return this.repo.create(data);
  }

  save(sub: Subscription): Promise<Subscription> {
    return this.repo.save(sub);
  }
}

export const subscriptionsRepository = new SubscriptionsRepository();
