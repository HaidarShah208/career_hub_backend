import {
  APPLICATION_STATUSES,
  ApplicationStatus,
  JOB_STATUSES,
  JobStatus,
} from '../../shared/constants';
import { applicationsRepository } from '../applications/applications.repository';
import { companiesRepository } from '../companies/companies.repository';
import { jobsRepository } from '../jobs/jobs.repository';
import { usersRepository } from '../users/users.repository';
import { DashboardStats } from './admin.types';

/**
 * Aggregates platform-wide statistics by delegating to each module's
 * repository. Keeps cross-module reporting in one place without breaking
 * module boundaries.
 */
export class AdminRepository {
  async getDashboardStats(): Promise<DashboardStats> {
    const [totalUsers, totalCompanies, totalJobs, totalApplications] = await Promise.all([
      usersRepository.count(),
      companiesRepository.count(),
      jobsRepository.count(),
      applicationsRepository.count(),
    ]);

    const jobStatusCounts = await Promise.all(
      JOB_STATUSES.map((status) => jobsRepository.countByStatus(status)),
    );
    const applicationStatusCounts = await Promise.all(
      APPLICATION_STATUSES.map((status) => applicationsRepository.countByStatus(status)),
    );

    const jobsByStatus = JOB_STATUSES.reduce((acc, status, index) => {
      acc[status] = jobStatusCounts[index];
      return acc;
    }, {} as Record<JobStatus, number>);

    const applicationsByStatus = APPLICATION_STATUSES.reduce((acc, status, index) => {
      acc[status] = applicationStatusCounts[index];
      return acc;
    }, {} as Record<ApplicationStatus, number>);

    return {
      users: { total: totalUsers },
      companies: { total: totalCompanies },
      jobs: { total: totalJobs, byStatus: jobsByStatus },
      applications: { total: totalApplications, byStatus: applicationsByStatus },
    };
  }
}

export const adminRepository = new AdminRepository();
