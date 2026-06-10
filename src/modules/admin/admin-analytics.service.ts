import { UserRole } from '../../shared/constants';
import { applicationsRepository } from '../applications/applications.repository';
import { paymentsRepository } from '../billing/payments.repository';
import { subscriptionsRepository } from '../billing/subscriptions.repository';
import { jobsRepository } from '../jobs/jobs.repository';
import { usersRepository } from '../users/users.repository';
import { AdminAnalytics, AdminRevenue, AdminRevenueTransaction } from './admin.types';

const ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.CANDIDATE]: 'Candidates',
  [UserRole.EMPLOYER]: 'Employers',
  [UserRole.ADMIN]: 'Admins',
};

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
    const [successfulPayments, pendingPayments, activeSubscriptions] = await Promise.all([
      paymentsRepository.findSuccessful(200),
      paymentsRepository.findPendingVerification(),
      subscriptionsRepository.findAllWithPlan(),
    ]);

    const now = new Date();
    const yearStart = new Date(now.getFullYear(), 0, 1);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    let totalRevenueYtd = 0;
    let revenueThisMonth = 0;
    const monthlyMap = new Map<string, number>();

    for (const payment of successfulPayments) {
      const paidAt = payment.paidAt ? new Date(payment.paidAt) : new Date(payment.createdAt);
      if (paidAt >= yearStart) totalRevenueYtd += payment.amount;
      if (paidAt >= monthStart) revenueThisMonth += payment.amount;
      const key = monthKey(paidAt);
      monthlyMap.set(key, (monthlyMap.get(key) ?? 0) + payment.amount);
    }

    const pendingRevenue = pendingPayments.reduce((sum, p) => sum + p.amount, 0);

    const revenueByMonth: Array<{ month: string; revenue: number }> = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleString('en-US', { month: 'short' });
      revenueByMonth.push({ month: label, revenue: monthlyMap.get(monthKey(d)) ?? 0 });
    }

    const recentTransactions: AdminRevenueTransaction[] = successfulPayments.slice(0, 10).map((p) => ({
      id: p.id,
      company: p.employer ? `${p.employer.firstName} ${p.employer.lastName}`.trim() : 'Employer',
      plan: p.plan?.name ?? 'Subscription',
      amount: p.amount,
      status: 'paid' as const,
      createdAt: (p.paidAt ?? p.createdAt).toISOString(),
    }));

    const activePremiumListings = activeSubscriptions.filter((s) => s.status === 'ACTIVE').length;

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
