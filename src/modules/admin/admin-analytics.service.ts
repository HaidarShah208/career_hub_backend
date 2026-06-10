import { JobStatus, UserRole } from '../../shared/constants';
import { applicationsRepository } from '../applications/applications.repository';
import { jobsRepository } from '../jobs/jobs.repository';
import { usersRepository } from '../users/users.repository';
import { AdminAnalytics, AdminRevenue, AdminRevenueTransaction } from './admin.types';

const ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.CANDIDATE]: 'Candidates',
  [UserRole.EMPLOYER]: 'Employers',
  [UserRole.ADMIN]: 'Admins',
};

const FEATURED_PRICE = 75_000;
const URGENT_PRICE = 35_000;

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function fillDaily(
  signups: Array<{ period: Date; count: number }>,
  applications: Array<{ period: Date; count: number }>,
  days: number,
): Array<{ day: string; signups: number; applications: number }> {
  const signupMap = new Map(signups.map((r) => [dayKey(r.period), r.count]));
  const appMap = new Map(applications.map((r) => [dayKey(r.period), r.count]));
  const result: Array<{ day: string; signups: number; applications: number }> = [];
  const now = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    d.setHours(0, 0, 0, 0);
    const label = d.toLocaleDateString('en-US', { weekday: 'short' });
    result.push({
      day: label,
      signups: signupMap.get(dayKey(d)) ?? 0,
      applications: appMap.get(dayKey(d)) ?? 0,
    });
  }
  return result;
}

function monthKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}`;
}

function jobListingAmount(isFeatured: boolean, isUrgent: boolean): number {
  let amount = 0;
  if (isFeatured) amount += FEATURED_PRICE;
  if (isUrgent) amount += URGENT_PRICE;
  return amount;
}

function planLabel(isFeatured: boolean, isUrgent: boolean): string {
  if (isFeatured && isUrgent) return 'Featured + Urgent';
  if (isFeatured) return 'Featured';
  if (isUrgent) return 'Urgent';
  return 'Standard';
}

export class AdminAnalyticsService {
  async getSiteAnalytics(): Promise<AdminAnalytics> {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const [
      totalUsers,
      candidateCount,
      employerCount,
      adminCount,
      totalJobViews,
      signupRows,
      applicationRows,
      categoryRows,
    ] = await Promise.all([
      usersRepository.count(),
      usersRepository.countByRole(UserRole.CANDIDATE),
      usersRepository.countByRole(UserRole.EMPLOYER),
      usersRepository.countByRole(UserRole.ADMIN),
      jobsRepository.sumViewCount(),
      usersRepository.countPerDay(7),
      applicationsRepository.countPerDay(7),
      jobsRepository.countByCategory(),
    ]);

    const weeklySignups = signupRows.reduce((sum, r) => sum + r.count, 0);
    const weeklyApplications = applicationRows.reduce((sum, r) => sum + r.count, 0);

    return {
      totalUsers,
      usersByRole: [
        { name: ROLE_LABELS[UserRole.CANDIDATE], value: candidateCount },
        { name: ROLE_LABELS[UserRole.EMPLOYER], value: employerCount },
        { name: ROLE_LABELS[UserRole.ADMIN], value: adminCount },
      ].filter((r) => r.value > 0),
      totalJobViews,
      weeklyJobViews: totalJobViews,
      weeklySignups,
      weeklyApplications,
      trafficByDay: fillDaily(signupRows, applicationRows, 7),
      jobsByCategory: categoryRows
        .filter((r) => r.count > 0)
        .slice(0, 8)
        .map((r) => ({
          name: r.category.charAt(0).toUpperCase() + r.category.slice(1).replace(/_/g, ' '),
          value: r.count,
        })),
    };
  }

  async getRevenue(): Promise<AdminRevenue> {
    const premiumJobs = await jobsRepository.findPremiumJobs(100);
    const now = new Date();
    const yearStart = new Date(now.getFullYear(), 0, 1);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    let totalRevenueYtd = 0;
    let revenueThisMonth = 0;
    let pendingRevenue = 0;
    const monthlyMap = new Map<string, number>();

    for (const job of premiumJobs) {
      const amount = jobListingAmount(Boolean(job.isFeatured), Boolean(job.isUrgent));
      if (!amount) continue;

      const created = new Date(job.createdAt);
      const isPaid = job.status === JobStatus.PUBLISHED;
      if (!isPaid) {
        pendingRevenue += amount;
      }

      if (created >= yearStart && isPaid) totalRevenueYtd += amount;
      if (created >= monthStart && isPaid) revenueThisMonth += amount;

      if (isPaid) {
        const key = monthKey(created);
        monthlyMap.set(key, (monthlyMap.get(key) ?? 0) + amount);
      }
    }

    const revenueByMonth: Array<{ month: string; revenue: number }> = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleString('en-US', { month: 'short' });
      revenueByMonth.push({ month: label, revenue: monthlyMap.get(monthKey(d)) ?? 0 });
    }

    const recentTransactions: AdminRevenueTransaction[] = premiumJobs.slice(0, 10).map((job) => ({
      id: job.id,
      company: job.company?.name ?? 'Company',
      plan: planLabel(Boolean(job.isFeatured), Boolean(job.isUrgent)),
      amount: jobListingAmount(Boolean(job.isFeatured), Boolean(job.isUrgent)),
      status: job.status === JobStatus.PUBLISHED ? 'paid' : 'pending',
      createdAt: job.createdAt.toISOString(),
    }));

    const activePremiumListings = await jobsRepository.countPremiumPublished();

    return {
      totalRevenueYtd,
      revenueThisMonth,
      activePremiumListings,
      pendingRevenue,
      revenueByMonth,
      recentTransactions,
    };
  }
}

export const adminAnalyticsService = new AdminAnalyticsService();
