import { ApplicationStatus, JobStatus, UserRole } from '../../shared/constants';
import { applicationsRepository } from '../applications/applications.repository';
import { companiesRepository } from '../companies/companies.repository';
import { jobsRepository } from '../jobs/jobs.repository';
import { usersRepository } from '../users/users.repository';

export interface PublicStats {
  activeJobs: number;
  companies: number;
  candidates: number;
  hired: number;
}

/** Aggregates platform counts for the public home page (no auth required). */
export class PublicService {
  async getStats(): Promise<PublicStats> {
    const [activeJobs, companies, candidates, hired] = await Promise.all([
      jobsRepository.countByStatus(JobStatus.PUBLISHED),
      companiesRepository.count(),
      usersRepository.countByRole(UserRole.CANDIDATE),
      applicationsRepository.countByStatus(ApplicationStatus.HIRED),
    ]);

    return { activeJobs, companies, candidates, hired };
  }
}

export const publicService = new PublicService();
