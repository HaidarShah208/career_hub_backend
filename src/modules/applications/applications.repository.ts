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

  /** Application counts grouped by calendar month for the last N months. */
  async countByCompanyPerMonth(
    companyId: string,
    months: number,
  ): Promise<Array<{ period: string; label: string; count: number }>> {
    const since = new Date();
    since.setMonth(since.getMonth() - (months - 1));
    since.setDate(1);
    since.setHours(0, 0, 0, 0);

    const rows = await this.repo
      .createQueryBuilder('application')
      .leftJoin('application.job', 'job')
      .select("DATE_TRUNC('month', application.createdAt)", 'period')
      .addSelect("TO_CHAR(application.createdAt, 'Mon')", 'label')
      .addSelect('COUNT(application.id)', 'count')
      .where('job.companyId = :companyId', { companyId })
      .andWhere('application.createdAt >= :since', { since })
      .groupBy("DATE_TRUNC('month', application.createdAt)")
      .addGroupBy("TO_CHAR(application.createdAt, 'Mon')")
      .orderBy("DATE_TRUNC('month', application.createdAt)", 'ASC')
      .getRawMany<{ period: string; label: string; count: string }>();

    return rows.map((r) => ({
      period: r.period,
      label: r.label,
      count: Number(r.count),
    }));
  }

  /** Application counts grouped by ISO week for the last N weeks. */
  async countByCompanyPerWeek(
    companyId: string,
    weeks: number,
  ): Promise<Array<{ label: string; count: number }>> {
    const since = new Date();
    since.setDate(since.getDate() - weeks * 7);

    const rows = await this.repo
      .createQueryBuilder('application')
      .leftJoin('application.job', 'job')
      .select("TO_CHAR(application.createdAt, 'IYYY-IW')", 'weekKey')
      .addSelect('MIN(application.createdAt)', 'weekStart')
      .addSelect('COUNT(application.id)', 'count')
      .where('job.companyId = :companyId', { companyId })
      .andWhere('application.createdAt >= :since', { since })
      .groupBy("TO_CHAR(application.createdAt, 'IYYY-IW')")
      .orderBy('weekStart', 'ASC')
      .getRawMany<{ weekKey: string; weekStart: string; count: string }>();

    return rows.map((r, i) => ({
      label: `W${i + 1}`,
      count: Number(r.count),
    }));
  }

  /** Application counts grouped by status for an employer's jobs. */
  async countByCompanyPerStatus(
    companyId: string,
  ): Promise<Array<{ status: ApplicationStatus; count: number }>> {
    const rows = await this.repo
      .createQueryBuilder('application')
      .leftJoin('application.job', 'job')
      .select('application.status', 'status')
      .addSelect('COUNT(application.id)', 'count')
      .where('job.companyId = :companyId', { companyId })
      .groupBy('application.status')
      .getRawMany<{ status: ApplicationStatus; count: string }>();

    return rows.map((r) => ({ status: r.status, count: Number(r.count) }));
  }

  /** Application counts per job for a company. */
  async countPerJobByCompany(
    companyId: string,
  ): Promise<Array<{ jobId: string; count: number }>> {
    const rows = await this.repo
      .createQueryBuilder('application')
      .leftJoin('application.job', 'job')
      .select('application.jobId', 'jobId')
      .addSelect('COUNT(application.id)', 'count')
      .where('job.companyId = :companyId', { companyId })
      .groupBy('application.jobId')
      .getRawMany<{ jobId: string; count: string }>();

    return rows.map((r) => ({ jobId: r.jobId, count: Number(r.count) }));
  }
}

export const applicationsRepository = new ApplicationsRepository();
