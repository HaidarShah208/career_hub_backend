import { BadRequestError, NotFoundError } from '../../shared/errors';
import {
  applicationEmailService,
  sendApplicationEmailAsync,
} from '../../shared/services/application-email.service';
import { AuthUser } from '../../shared/types';
import { buildPaginationMeta, PaginationMeta } from '../../shared/utils/pagination';
import { Application } from '../applications/application.entity';
import { applicationsRepository } from '../applications/applications.repository';
import { ListApplicationsQuery, UpdateApplicationStatusDto } from '../applications/applications.types';
import { employerCompanyService } from './employer-company.service';

/**
 * Applicant inbox + hiring decisions scoped to the employer's company. An
 * employer can only ever see / act on applications submitted to their own jobs.
 */
export class EmployerApplicantsService {
  /** GET /employer/applicants */
  async list(
    query: ListApplicationsQuery,
    ownerId: string,
  ): Promise<{ items: Application[]; meta: PaginationMeta }> {
    const company = await employerCompanyService.getMyCompany(ownerId);
    const [items, total] = await applicationsRepository.findAndCountByCompany(company.id, query);
    return { items, meta: buildPaginationMeta(total, query.page, query.limit) };
  }

  /** GET /employer/applicants/:id (includes the status timeline). */
  async getById(id: string, ownerId: string): Promise<Application> {
    const company = await employerCompanyService.getMyCompany(ownerId);
    const application = await applicationsRepository.findByIdWithHistory(id);
    if (!application || application.job.companyId !== company.id) {
      throw new NotFoundError('Applicant not found');
    }
    return application;
  }

  /** PATCH /employer/applications/:id/status */
  async updateStatus(
    id: string,
    dto: UpdateApplicationStatusDto,
    actor: AuthUser,
  ): Promise<Application> {
    const company = await employerCompanyService.getMyCompany(actor.id);

    const application = await applicationsRepository.findById(id);
    if (!application || application.job.companyId !== company.id) {
      throw new NotFoundError('Application not found');
    }
    if (application.status === dto.status) {
      throw new BadRequestError(`Application is already ${dto.status}`);
    }

    await applicationsRepository.updateStatusWithHistory(application, dto.status, actor.id, dto.note);

    sendApplicationEmailAsync(() =>
      applicationEmailService.notifyCandidateStatusChange(id, dto.status, dto.note),
    );

    return this.getById(id, actor.id);
  }
}

export const employerApplicantsService = new EmployerApplicantsService();
