import { ApplicationStatus } from '../../shared/constants';
import { applicationsRepository } from '../applications/applications.repository';
import { jobsRepository } from '../jobs/jobs.repository';
import { employerCompanyService } from './employer-company.service';

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  [ApplicationStatus.APPLIED]: 'Applied',
  [ApplicationStatus.UNDER_REVIEW]: 'Under review',
  [ApplicationStatus.SHORTLISTED]: 'Shortlisted',
  [ApplicationStatus.INTERVIEW_SCHEDULED]: 'Interview',
  [ApplicationStatus.REJECTED]: 'Rejected',
  [ApplicationStatus.HIRED]: 'Hired',
};

export interface EmployerAnalytics {
  totalJobViews: number;
  applicationsByMonth: Array<{ month: string; applications: number }>;
  applicationsByWeek: Array<{ week: string; applications: number }>;
  applicantsByStatus: Array<{ name: string; value: number }>;
  jobPerformance: Array<{ jobId: string; job: string; views: number; applies: number }>;
}

function fillMonthly(
  rows: Array<{ label: string; count: number }>,
  months: number,
): Array<{ month: string; applications: number }> {
  const result: Array<{ month: string; applications: number }> = [];
  const now = new Date();
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = d.toLocaleString('en-US', { month: 'short' });
    const match = rows.find((r) => r.label === label);
    result.push({ month: label, applications: match?.count ?? 0 });
  }
  return result;
}

function fillWeekly(
  rows: Array<{ label: string; count: number }>,
  weeks: number,
): Array<{ week: string; applications: number }> {
  return Array.from({ length: weeks }, (_, i) => {
    const label = `W${i + 1}`;
    const match = rows.find((r) => r.label === label);
    return { week: label, applications: match?.count ?? 0 };
  });
}

export class EmployerAnalyticsService {
  /** GET /employer/analytics */
  async getAnalytics(ownerId: string): Promise<EmployerAnalytics> {
    const company = await employerCompanyService.getMyCompany(ownerId);

    const [totalJobViews, monthlyRows, weeklyRows, statusRows, applyPerJob, jobs] =
      await Promise.all([
        jobsRepository.sumViewCountByCompany(company.id),
        applicationsRepository.countByCompanyPerMonth(company.id, 6),
        applicationsRepository.countByCompanyPerWeek(company.id, 6),
        applicationsRepository.countByCompanyPerStatus(company.id),
        applicationsRepository.countPerJobByCompany(company.id),
        jobsRepository.findByCompanyId(company.id),
      ]);

    const applyMap = new Map(applyPerJob.map((r) => [r.jobId, r.count]));

    return {
      totalJobViews,
      applicationsByMonth: fillMonthly(monthlyRows, 6),
      applicationsByWeek: fillWeekly(weeklyRows, 6),
      applicantsByStatus: statusRows
        .filter((r) => r.count > 0)
        .map((r) => ({ name: STATUS_LABELS[r.status], value: r.count })),
      jobPerformance: jobs.map((job) => ({
        jobId: job.id,
        job: job.title.length > 18 ? `${job.title.slice(0, 16)}…` : job.title,
        views: job.viewCount ?? 0,
        applies: applyMap.get(job.id) ?? 0,
      })),
    };
  }
}

export const employerAnalyticsService = new EmployerAnalyticsService();
