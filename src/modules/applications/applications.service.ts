import { JobStatus, UserRole } from '../../shared/constants';
import { BadRequestError, ConflictError, NotFoundError } from '../../shared/errors';
import { AuthUser } from '../../shared/types';
import { buildPaginationMeta, PaginationMeta } from '../../shared/utils/pagination';
import { jobsRepository } from '../jobs/jobs.repository';
import { Application } from './application.entity';
import { applicationsRepository, ApplicationsRepository } from './applications.repository';
import {
  CreateApplicationDto,
  ListApplicationsQuery,
  UpdateApplicationStatusDto,
} from './applications.types';

export class ApplicationsService {
  constructor(private readonly repo: ApplicationsRepository = applicationsRepository) {}

  /** POST /applications */
  async create(dto: CreateApplicationDto, actor: AuthUser): Promise<Application> {
    const job = await jobsRepository.findById(dto.jobId);
    if (!job) {
      throw new NotFoundError('Job not found');
    }
    if (job.status !== JobStatus.PUBLISHED) {
      throw new BadRequestError('This job is no longer accepting applications');
    }

    const alreadyApplied = await this.repo.existsByCandidateAndJob(actor.id, dto.jobId);
    if (alreadyApplied) {
      throw new ConflictError('You have already applied to this job');
    }

    const application = await this.repo.createWithHistory({
      candidateId: actor.id,
      jobId: dto.jobId,
    });

    // Applying implies the candidate viewed the listing.
    await jobsRepository.incrementViewCount(dto.jobId);

    return application;
  }

  /** GET /applications and /admin/applications */
  async list(
    query: ListApplicationsQuery,
    actor: AuthUser,
  ): Promise<{ items: Application[]; meta: PaginationMeta }> {
    // Candidates can only ever see their own applications.
    const scopedCandidateId = actor.role === UserRole.CANDIDATE ? actor.id : undefined;
    const [items, total] = await this.repo.findAndCount(query, scopedCandidateId);
    return { items, meta: buildPaginationMeta(total, query.page, query.limit) };
  }

  /** GET /applications/my — the current candidate's applications. */
  async listMine(
    query: ListApplicationsQuery,
    candidateId: string,
  ): Promise<{ items: Application[]; meta: PaginationMeta }> {
    const [items, total] = await this.repo.findAndCount(query, candidateId);
    return { items, meta: buildPaginationMeta(total, query.page, query.limit) };
  }

  /** GET /applications/:id (includes the status timeline). */
  async getById(id: string, actor: AuthUser): Promise<Application> {
    const application = await this.repo.findByIdWithHistory(id);
    if (!application) {
      throw new NotFoundError('Application not found');
    }
    if (actor.role === UserRole.CANDIDATE && application.candidateId !== actor.id) {
      throw new NotFoundError('Application not found');
    }
    return application;
  }

  /** PATCH /applications/:id/status (admin) — updates status + timeline. */
  async updateStatus(
    id: string,
    dto: UpdateApplicationStatusDto,
    actor: AuthUser,
  ): Promise<Application> {
    const application = await this.repo.findById(id);
    if (!application) {
      throw new NotFoundError('Application not found');
    }

    if (application.status === dto.status) {
      throw new BadRequestError(`Application is already ${dto.status}`);
    }

    await this.repo.updateStatusWithHistory(application, dto.status, actor.id, dto.note);
    return this.getById(id, actor);
  }
}

export const applicationsService = new ApplicationsService();
