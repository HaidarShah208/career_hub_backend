import { Repository } from 'typeorm';
import { AppDataSource } from '../../config/database';
import { ApplicationStatus } from '../../shared/constants';
import { Application } from './application.entity';
import { ApplicationStatusHistory } from './application-status-history.entity';
import { ListApplicationsQuery } from './applications.types';

export class ApplicationsRepository {
  private get repo(): Repository<Application> {
    return AppDataSource.getRepository(Application);
  }

  /**
   * Persists a new application together with its initial APPLIED timeline
   * entry in a single transaction.
   */
  createWithHistory(data: { candidateId: string; jobId: string }): Promise<Application> {
    return AppDataSource.transaction(async (manager) => {
      const appRepo = manager.getRepository(Application);
      const historyRepo = manager.getRepository(ApplicationStatusHistory);

      const application = appRepo.create({
        candidateId: data.candidateId,
        jobId: data.jobId,
        status: ApplicationStatus.APPLIED,
      });
      const saved = await appRepo.save(application);

      await historyRepo.save(
        historyRepo.create({
          applicationId: saved.id,
          status: ApplicationStatus.APPLIED,
          note: 'Application submitted',
        }),
      );

      return saved;
    });
  }

  /**
   * Updates an application's status and appends a timeline entry atomically.
   */
  updateStatusWithHistory(
    application: Application,
    status: ApplicationStatus,
    changedById: string,
    note?: string,
  ): Promise<Application> {
    return AppDataSource.transaction(async (manager) => {
      const appRepo = manager.getRepository(Application);
      const historyRepo = manager.getRepository(ApplicationStatusHistory);

      application.status = status;
      const saved = await appRepo.save(application);

      await historyRepo.save(
        historyRepo.create({
          applicationId: saved.id,
          status,
          changedById,
          note: note ?? null,
        }),
      );

      return saved;
    });
  }

  findById(id: string): Promise<Application | null> {
    return this.repo.findOne({ where: { id }, relations: { job: true, candidate: true } });
  }

  /** Loads an application with its full, chronologically ordered timeline. */
  findByIdWithHistory(id: string): Promise<Application | null> {
    return this.repo
      .createQueryBuilder('application')
      .leftJoinAndSelect('application.job', 'job')
      .leftJoinAndSelect('application.candidate', 'candidate')
      .leftJoinAndSelect('application.history', 'history')
      .where('application.id = :id', { id })
      .orderBy('history.createdAt', 'ASC')
      .getOne();
  }

  existsByCandidateAndJob(candidateId: string, jobId: string): Promise<boolean> {
    return this.repo.existsBy({ candidateId, jobId });
  }

  /**
   * @param scopedCandidateId  When set, results are restricted to this
   *                           candidate (used so candidates only see their own
   *                           applications).
   */
  async findAndCount(
    query: ListApplicationsQuery,
    scopedCandidateId?: string,
  ): Promise<[Application[], number]> {
    const { page, limit, status, jobId, sortOrder } = query;

    const qb = this.repo
      .createQueryBuilder('application')
      .leftJoinAndSelect('application.job', 'job')
      .leftJoinAndSelect('application.candidate', 'candidate')
      .orderBy('application.createdAt', sortOrder)
      .skip((page - 1) * limit)
      .take(limit);

    if (scopedCandidateId) {
      qb.andWhere('application.candidateId = :scopedCandidateId', { scopedCandidateId });
    }
    if (status) qb.andWhere('application.status = :status', { status });
    if (jobId) qb.andWhere('application.jobId = :jobId', { jobId });

    return qb.getManyAndCount();
  }

  /**
   * Lists applications submitted to jobs owned by a given company. Used by the
   * employer applicant inbox so employers only ever see their own applicants.
   */
  async findAndCountByCompany(
    companyId: string,
    query: ListApplicationsQuery,
  ): Promise<[Application[], number]> {
    const { page, limit, status, jobId, sortOrder } = query;

    const qb = this.repo
      .createQueryBuilder('application')
      .leftJoinAndSelect('application.job', 'job')
      .leftJoinAndSelect('application.candidate', 'candidate')
      .where('job.companyId = :companyId', { companyId })
      .orderBy('application.createdAt', sortOrder)
      .skip((page - 1) * limit)
      .take(limit);

    if (status) qb.andWhere('application.status = :status', { status });
    if (jobId) qb.andWhere('application.jobId = :jobId', { jobId });

    return qb.getManyAndCount();
  }

  count(): Promise<number> {
    return this.repo.count();
  }

  countByStatus(status: ApplicationStatus): Promise<number> {
    return this.repo.count({ where: { status } });
  }

  countByCompany(companyId: string): Promise<number> {
    return this.repo
      .createQueryBuilder('application')
      .leftJoin('application.job', 'job')
      .where('job.companyId = :companyId', { companyId })
      .getCount();
  }

  countByCompanyAndStatus(companyId: string, status: ApplicationStatus): Promise<number> {
    return this.repo
      .createQueryBuilder('application')
      .leftJoin('application.job', 'job')
      .where('job.companyId = :companyId', { companyId })
      .andWhere('application.status = :status', { status })
      .getCount();
  }

  findRecentByCompany(companyId: string, limit: number): Promise<Application[]> {
    return this.repo
      .createQueryBuilder('application')
      .leftJoinAndSelect('application.job', 'job')
      .leftJoinAndSelect('application.candidate', 'candidate')
      .where('job.companyId = :companyId', { companyId })
      .orderBy('application.createdAt', 'DESC')
      .take(limit)
      .getMany();
  }
}

export const applicationsRepository = new ApplicationsRepository();
