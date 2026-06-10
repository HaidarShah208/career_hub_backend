import { NotFoundError } from '../../shared/errors';
import { buildPaginationMeta, PaginationMeta } from '../../shared/utils/pagination';
import { companiesRepository } from '../companies/companies.repository';
import { toPublicUser } from '../users/user.mapper';
import { usersRepository } from '../users/users.repository';
import { ListUsersQuery, PublicUser } from '../users/users.types';
import { adminAnalyticsService } from './admin-analytics.service';
import { adminRepository, AdminRepository } from './admin.repository';
import {
  AdminAnalytics,
  AdminRevenue,
  DashboardStats,
  PendingEmployerCompany,
} from './admin.types';

export class AdminService {
  constructor(private readonly repo: AdminRepository = adminRepository) {}

  getDashboard(): Promise<DashboardStats> {
    return this.repo.getDashboardStats();
  }

  async listUsers(
    query: ListUsersQuery,
  ): Promise<{ items: PublicUser[]; meta: PaginationMeta }> {
    const [users, total] = await usersRepository.findAndCount(query);
    return {
      items: users.map(toPublicUser),
      meta: buildPaginationMeta(total, query.page, query.limit),
    };
  }

  async updateUserStatus(id: string, isActive: boolean): Promise<PublicUser> {
    const user = await usersRepository.setActive(id, isActive);
    if (!user) {
      throw new NotFoundError('User not found');
    }
    return toPublicUser(user);
  }

  async listPendingEmployers(): Promise<PendingEmployerCompany[]> {
    const companies = await companiesRepository.findUnverified();
    return companies.map((c) => ({
      id: c.id,
      name: c.name,
      industry: c.industry,
      location: c.location,
      logo: c.logo,
      ownerName: c.owner ? `${c.owner.firstName} ${c.owner.lastName}`.trim() : 'Employer',
      ownerEmail: c.owner?.email ?? '',
      createdAt: c.createdAt,
    }));
  }

  async verifyCompany(id: string, verified: boolean): Promise<void> {
    const company = await companiesRepository.findById(id);
    if (!company) {
      throw new NotFoundError('Company not found');
    }
    if (!verified) {
      await companiesRepository.remove(company);
      return;
    }
    await companiesRepository.setVerified(id, true);
  }

  getSiteAnalytics(): Promise<AdminAnalytics> {
    return adminAnalyticsService.getSiteAnalytics();
  }

  getRevenue(): Promise<AdminRevenue> {
    return adminAnalyticsService.getRevenue();
  }
}

export const adminService = new AdminService();
