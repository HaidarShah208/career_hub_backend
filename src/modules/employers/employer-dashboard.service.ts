import { ApplicationStatus, JobStatus } from '../../shared/constants';
import { Application } from '../applications/application.entity';
import { applicationsRepository } from '../applications/applications.repository';
import { jobsRepository } from '../jobs/jobs.repository';
import { employerCompanyService } from './employer-company.service';

export interface EmployerDashboard {
  company: { id: string; name: string };
  totalJobs: number;
  activeJobs: number;
  totalApplicants: number;
  hiredCandidates: number;
  recentApplications: Application[];
}

export class EmployerDashboardService {
  /** GET /employer/dashboard */
  async getDashboard(ownerId: string): Promise<EmployerDashboard> {
    const company = await employerCompanyService.getMyCompany(ownerId);

    const [totalJobs, activeJobs, totalApplicants, hiredCandidates, recentApplications] =
      await Promise.all([
        jobsRepository.countByCompany(company.id),
        jobsRepository.countByCompanyAndStatus(company.id, JobStatus.PUBLISHED),
        applicationsRepository.countByCompany(company.id),
        applicationsRepository.countByCompanyAndStatus(company.id, ApplicationStatus.HIRED),
        applicationsRepository.findRecentByCompany(company.id, 5),
      ]);

    return {
      company: { id: company.id, name: company.name },
      totalJobs,
      activeJobs,
      totalApplicants,
      hiredCandidates,
      recentApplications,
    };
  }
}

export const employerDashboardService = new EmployerDashboardService();
