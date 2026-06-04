import { JobStatus } from '../../shared/constants';
import { NotFoundError } from '../../shared/errors';
import { PaginationMeta } from '../../shared/utils/pagination';
import { Job } from '../jobs/job.entity';
import { jobsRepository } from '../jobs/jobs.repository';
import { jobsService } from '../jobs/jobs.service';
import { ListJobsQuery } from '../jobs/jobs.types';
import { employerCompanyService } from './employer-company.service';
import { EmployerJobDto, UpdateEmployerJobDto } from './employer.types';

/**
 * Job management scoped to the employer's own company. All ownership checks go
 * through the company resolved from the authenticated employer, so an employer
 * can never read or mutate another company's jobs.
 */
export class EmployerJobsService {
  /** Ensures the job belongs to the employer's company before returning it. */
  private async getOwnedJob(id: string, ownerId: string): Promise<Job> {
    const company = await employerCompanyService.getMyCompany(ownerId);
    const job = await jobsRepository.findById(id);
    if (!job || job.companyId !== company.id) {
      throw new NotFoundError('Job not found');
    }
    return job;
  }

  /** POST /employer/jobs */
  async create(dto: EmployerJobDto, ownerId: string): Promise<Job> {
    const company = await employerCompanyService.getMyCompany(ownerId);
    return jobsService.create({ ...dto, companyId: company.id });
  }

  /** GET /employer/jobs */
  async list(
    query: Omit<ListJobsQuery, 'companyId'>,
    ownerId: string,
  ): Promise<{ items: Job[]; meta: PaginationMeta }> {
    const company = await employerCompanyService.getMyCompany(ownerId);
    return jobsService.list({ ...query, companyId: company.id });
  }

  /** GET /employer/jobs/:id */
  async getById(id: string, ownerId: string): Promise<Job> {
    return this.getOwnedJob(id, ownerId);
  }

  /** PUT /employer/jobs/:id */
  async update(id: string, dto: UpdateEmployerJobDto, ownerId: string): Promise<Job> {
    await this.getOwnedJob(id, ownerId);
    return jobsService.update(id, dto);
  }

  /** DELETE /employer/jobs/:id */
  async remove(id: string, ownerId: string): Promise<void> {
    await this.getOwnedJob(id, ownerId);
    return jobsService.remove(id);
  }

  /** PATCH /employer/jobs/:id/publish */
  async publish(id: string, ownerId: string): Promise<Job> {
    await this.getOwnedJob(id, ownerId);
    return jobsService.update(id, { status: JobStatus.PUBLISHED });
  }

  /** PATCH /employer/jobs/:id/close */
  async close(id: string, ownerId: string): Promise<Job> {
    await this.getOwnedJob(id, ownerId);
    return jobsService.update(id, { status: JobStatus.CLOSED });
  }
}

export const employerJobsService = new EmployerJobsService();
