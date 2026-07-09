import { cache } from '../../config/redis';
import { CACHE_KEYS, CACHE_TTL, JobStatus, PAGINATION } from '../../shared/constants';
import { NotFoundError } from '../../shared/errors';
import { logger } from '../../shared/logger';
import { buildPaginationMeta, PaginationMeta } from '../../shared/utils/pagination';
import { uniqueSlug } from '../../shared/utils/slug';
import { companiesRepository } from '../companies/companies.repository';
import { Job } from './job.entity';
import { jobsRepository, JobsRepository } from './jobs.repository';
import { CreateJobDto, ListJobsQuery, UpdateJobDto } from './jobs.types';

interface JobListResult {
  items: Job[];
  meta: PaginationMeta;
}

export class JobsService {
  constructor(private readonly repo: JobsRepository = jobsRepository) {}

  /**
   * A request is cacheable only when it asks for the default, unfiltered first
   * page. That is the response that maps to the `jobs:all` cache key.
   */
  private isDefaultQuery(query: ListJobsQuery): boolean {
    return (
      query.page === PAGINATION.DEFAULT_PAGE &&
      query.limit === PAGINATION.DEFAULT_LIMIT &&
      !query.search &&
      !query.status &&
      !query.employmentType &&
      !query.companyId &&
      !query.location &&
      !query.city &&
      !query.category &&
      !query.experienceLevel &&
      query.salaryMin === undefined &&
      query.salaryMax === undefined
    );
  }

  private async invalidateJobsCache(): Promise<void> {
    await cache.del(CACHE_KEYS.JOBS_ALL);
  }

  /** GET /jobs (Redis-cached for the default listing). */
  async list(query: ListJobsQuery): Promise<JobListResult> {
    const cacheable = this.isDefaultQuery(query);

    if (cacheable) {
      const cached = await cache.get<JobListResult>(CACHE_KEYS.JOBS_ALL);
      if (cached) {
        logger.debug('Jobs list served from cache');
        return cached;
      }
    }

    const [items, total] = await this.repo.findAndCount(query);
    const result: JobListResult = {
      items,
      meta: buildPaginationMeta(total, query.page, query.limit),
    };

    if (cacheable) {
      await cache.set(CACHE_KEYS.JOBS_ALL, result, CACHE_TTL.JOBS);
    }

    return result;
  }

  /** GET /jobs/:id */
  async getById(id: string): Promise<Job> {
    const job = await this.repo.findById(id);
    if (!job) {
      throw new NotFoundError('Job not found');
    }
    return job;
  }

  /** POST /jobs/:id/view — increments the public detail-page view counter. */
  async recordView(id: string): Promise<{ viewCount: number }> {
    const job = await this.repo.findById(id);
    if (!job) {
      throw new NotFoundError('Job not found');
    }
    if (job.status !== JobStatus.PUBLISHED) {
      return { viewCount: job.viewCount ?? 0 };
    }
    await this.repo.incrementViewCount(id);
    return { viewCount: (job.viewCount ?? 0) + 1 };
  }

  /** POST /jobs */
  async create(dto: CreateJobDto): Promise<Job> {
    const company = await companiesRepository.findById(dto.companyId);
    if (!company) {
      throw new NotFoundError('Company not found for the provided companyId');
    }

    const job = this.repo.create({
      title: dto.title,
      slug: uniqueSlug(dto.title),
      description: dto.description,
      location: dto.location,
      employmentType: dto.employmentType,
      salaryMin: dto.salaryMin,
      salaryMax: dto.salaryMax,
      category: dto.category ?? null,
      experienceLevel: dto.experienceLevel ?? null,
      skills: dto.skills ?? null,
      applyMethod: dto.applyMethod ?? 'internal',
      applyUrl: dto.applyUrl || null,
      isUrgent: dto.isUrgent ?? false,
      isFeatured: dto.isFeatured ?? false,
      status: dto.status ?? JobStatus.PUBLISHED,
      companyId: dto.companyId,
    });

    const saved = await this.repo.save(job);
    await this.invalidateJobsCache();
    return saved;
  }

  /** PUT /jobs/:id */
  async update(id: string, dto: UpdateJobDto): Promise<Job> {
    const job = await this.repo.findById(id);
    if (!job) {
      throw new NotFoundError('Job not found');
    }

    if (dto.title !== undefined) {
      job.title = dto.title;
      job.slug = uniqueSlug(dto.title);
    }
    if (dto.description !== undefined) job.description = dto.description;
    if (dto.location !== undefined) job.location = dto.location;
    if (dto.employmentType !== undefined) job.employmentType = dto.employmentType;
    if (dto.salaryMin !== undefined) job.salaryMin = dto.salaryMin;
    if (dto.salaryMax !== undefined) job.salaryMax = dto.salaryMax;
    if (dto.category !== undefined) job.category = dto.category;
    if (dto.experienceLevel !== undefined) job.experienceLevel = dto.experienceLevel;
    if (dto.skills !== undefined) job.skills = dto.skills;
    if (dto.applyMethod !== undefined) job.applyMethod = dto.applyMethod;
    if (dto.applyUrl !== undefined) job.applyUrl = dto.applyUrl || null;
    if (dto.isUrgent !== undefined) job.isUrgent = dto.isUrgent;
    if (dto.isFeatured !== undefined) job.isFeatured = dto.isFeatured;
    if (dto.status !== undefined) job.status = dto.status;

    const saved = await this.repo.save(job);
    await this.invalidateJobsCache();
    return saved;
  }

  /** DELETE /jobs/:id */
  async remove(id: string): Promise<void> {
    const job = await this.repo.findById(id);
    if (!job) {
      throw new NotFoundError('Job not found');
    }
    await this.repo.remove(job);
    await this.invalidateJobsCache();
  }
}

export const jobsService = new JobsService();
