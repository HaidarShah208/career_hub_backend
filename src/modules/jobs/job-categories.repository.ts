import { Repository } from 'typeorm';
import { AppDataSource } from '../../config/database';
import { JobCategory } from './job-category.entity';

export class JobCategoriesRepository {
  private get repo(): Repository<JobCategory> {
    return AppDataSource.getRepository(JobCategory);
  }

  findAll(): Promise<JobCategory[]> {
    return this.repo.find({ order: { name: 'ASC' } });
  }

  findById(id: string): Promise<JobCategory | null> {
    return this.repo.findOne({ where: { id } });
  }

  findBySlug(slug: string): Promise<JobCategory | null> {
    return this.repo.findOne({ where: { slug } });
  }

  create(data: Pick<JobCategory, 'slug' | 'name'>): JobCategory {
    return this.repo.create(data);
  }

  save(category: JobCategory): Promise<JobCategory> {
    return this.repo.save(category);
  }

  async remove(id: string): Promise<void> {
    await this.repo.delete({ id });
  }
}

export const jobCategoriesRepository = new JobCategoriesRepository();
