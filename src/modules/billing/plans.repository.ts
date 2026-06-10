import { Repository } from 'typeorm';
import { AppDataSource } from '../../config/database';
import { Plan } from './plan.entity';

export class PlansRepository {
  private get repo(): Repository<Plan> {
    return AppDataSource.getRepository(Plan);
  }

  findAllActive(): Promise<Plan[]> {
    return this.repo.find({ where: { isActive: true }, order: { price: 'ASC' } });
  }

  findAll(): Promise<Plan[]> {
    return this.repo.find({ order: { price: 'ASC' } });
  }

  findById(id: string): Promise<Plan | null> {
    return this.repo.findOne({ where: { id } });
  }

  findBySlug(slug: string): Promise<Plan | null> {
    return this.repo.findOne({ where: { slug } });
  }

  create(data: Partial<Plan>): Plan {
    return this.repo.create(data);
  }

  save(plan: Plan): Promise<Plan> {
    return this.repo.save(plan);
  }

  async remove(plan: Plan): Promise<void> {
    await this.repo.remove(plan);
  }
}

export const plansRepository = new PlansRepository();
