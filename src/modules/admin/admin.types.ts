import { ApplicationStatus, JobStatus } from '../../shared/constants';

export interface DashboardStats {
  users: { total: number };
  companies: { total: number };
  jobs: {
    total: number;
    byStatus: Record<JobStatus, number>;
  };
  applications: {
    total: number;
    byStatus: Record<ApplicationStatus, number>;
  };
}
