import { Repository } from 'typeorm';
import { AppDataSource } from '../../config/database';
import { JobStatus } from '../../shared/constants';
import { Job } from './job.entity';
import { CreateJobDto, ListJobsQuery } from './jobs.types';

export class JobsRepository {
  private get repo(): Repository<Job> {
    return AppDataSource.getRepository(Job);
  }

  create(data: Partial<Job>): Job {
    return this.repo.create(data);
  }

  save(job: Job): Promise<Job> {
    return this.repo.save(job);
  }

  findById(id: string): Promise<Job | null> {
    return this.repo.findOne({ where: { id }, relations: { company: true } });
  }

  findBySlug(slug: string): Promise<Job | null> {
    return this.repo.findOne({ where: { slug }, relations: { company: true } });
  }

  async remove(job: Job): Promise<void> {
    await this.repo.remove(job);
  }

  async findAndCount(query: ListJobsQuery): Promise<[Job[], number]> {
    const {
      page,
      limit,
      search,
      status,
      employmentType,
      companyId,
      location,
      city,
      salaryMin,
      salaryMax,
      sortOrder,
    } = query;

    const qb = this.repo
      .createQueryBuilder('job')
      .leftJoinAndSelect('job.company', 'company')
      .orderBy('job.createdAt', sortOrder)
      .skip((page - 1) * limit)
      .take(limit);

    if (search) {
      qb.andWhere('(job.title ILIKE :search OR job.description ILIKE :search)', {
        search: `%${search}%`,
      });
    }
    if (status) qb.andWhere('job.status = :status', { status });
    if (employmentType) qb.andWhere('job.employmentType = :employmentType', { employmentType });
    if (companyId) qb.andWhere('job.companyId = :companyId', { companyId });

    // `city` and `location` both filter the job location (city is the public alias).
    const place = city ?? location;
    if (place) qb.andWhere('job.location ILIKE :place', { place: `%${place}%` });

    // Salary range: floor on the job's minimum, ceiling on the job's maximum.
    if (salaryMin !== undefined) qb.andWhere('job.salaryMin >= :salaryMin', { salaryMin });
    if (salaryMax !== undefined) qb.andWhere('job.salaryMax <= :salaryMax', { salaryMax });

    return qb.getManyAndCount();
  }

  count(): Promise<number> {
    return this.repo.count();
  }

  countByStatus(status: JobStatus): Promise<number> {
    return this.repo.count({ where: { status } });
  }

  countByCompany(companyId: string): Promise<number> {
    return this.repo.count({ where: { companyId } });
  }

  countByCompanyAndStatus(companyId: string, status: JobStatus): Promise<number> {
    return this.repo.count({ where: { companyId, status } });
  }
}

export const jobsRepository = new JobsRepository();
