import { ApplicationStatus, JobStatus, UserRole } from '../../shared/constants';
import { PublicUser } from '../users/users.types';

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

export interface AdminAnalytics {
  totalUsers: number;
  usersByRole: Array<{ name: string; value: number }>;
  totalJobViews: number;
  weeklyJobViews: number;
  weeklySignups: number;
  weeklyApplications: number;
  trafficByDay: Array<{ day: string; signups: number; applications: number }>;
  jobsByCategory: Array<{ name: string; value: number }>;
}

export interface AdminRevenueTransaction {
  id: string;
  company: string;
  plan: string;
  amount: number;
  status: 'paid' | 'pending';
  createdAt: string;
}

export interface AdminRevenue {
  totalRevenueYtd: number;
  revenueThisMonth: number;
  activePremiumListings: number;
  pendingRevenue: number;
  revenueByMonth: Array<{ month: string; revenue: number }>;
  recentTransactions: AdminRevenueTransaction[];
}

export interface PendingEmployerCompany {
  id: string;
  name: string;
  industry?: string | null;
  location?: string | null;
  logo?: string | null;
  ownerName: string;
  ownerEmail: string;
  createdAt: Date;
}

export type { PublicUser, UserRole };
