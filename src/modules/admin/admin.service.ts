import { EmployerStatus, UserRole } from '../../shared/constants';
import { BadRequestError, NotFoundError } from '../../shared/errors';
import { slugify } from '../../shared/utils/slug';
import { billingService } from '../billing/billing.service';
import { notificationService } from '../../shared/services/notification.service';
import { buildPaginationMeta, PaginationMeta } from '../../shared/utils/pagination';
import { companiesRepository } from '../companies/companies.repository';
import { jobCategoriesRepository } from '../jobs/job-categories.repository';
import { jobsRepository } from '../jobs/jobs.repository';
import { toPublicUser } from '../users/user.mapper';
import { usersRepository } from '../users/users.repository';
import { ListUsersQuery, PublicUser } from '../users/users.types';
import { adminAnalyticsService } from './admin-analytics.service';
import { adminRepository, AdminRepository } from './admin.repository';
import {
  AdminAnalytics,
  AdminCategoryItem,
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
    excludeUserId?: string,
  ): Promise<{ items: PublicUser[]; meta: PaginationMeta }> {
    const [users, total] = await usersRepository.findAndCount(query, {
      excludeUserId,
      excludeRoles: [UserRole.ADMIN],
    });
    return {
      items: users.map(toPublicUser),
      meta: buildPaginationMeta(total, query.page, query.limit),
    };
  }

  async updateUserStatus(id: string, isActive: boolean, actorId: string): Promise<PublicUser> {
    if (id === actorId) {
      throw new BadRequestError('You cannot change your own account status');
    }
    const existing = await usersRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('User not found');
    }
    if (existing.role === UserRole.ADMIN) {
      throw new BadRequestError('Admin accounts cannot be suspended or modified here');
    }
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

    const status = verified ? EmployerStatus.APPROVED : EmployerStatus.REJECTED;
    const companyWithOwner = await companiesRepository.findByIdWithOwner(id);
    await companiesRepository.setEmployerStatus(id, status);

    if (verified && companyWithOwner?.ownerId) {
      await billingService.provisionFreePlanIfNeeded(companyWithOwner.ownerId);
    }

    const email = companyWithOwner?.owner?.email;
    if (email) {
      await notificationService.send({
        to: email,
        type: verified ? 'EMPLOYER_APPROVED' : 'EMPLOYER_REJECTED',
        subject: verified ? 'Company approved' : 'Company verification rejected',
        body: verified
          ? 'Your company has been approved. Your free plan is active — you can post jobs or upgrade anytime.'
          : 'Your company verification was rejected. Please update your profile and documents.',
      });
    }
  }

  getSiteAnalytics(): Promise<AdminAnalytics> {
    return adminAnalyticsService.getSiteAnalytics();
  }

  getRevenue(): Promise<AdminRevenue> {
    return adminAnalyticsService.getRevenue();
  }

  async listCategories(): Promise<AdminCategoryItem[]> {
    const [catalog, counts] = await Promise.all([
      jobCategoriesRepository.findAll(),
      jobsRepository.countByCategory(),
    ]);
    const countBySlug = new Map(counts.map((r) => [r.category, r.count]));

    return catalog
      .map((cat) => ({
        id: cat.id,
        slug: cat.slug,
        name: cat.name,
        jobs: countBySlug.get(cat.slug) ?? 0,
      }))
      .sort((a, b) => b.jobs - a.jobs || a.name.localeCompare(b.name));
  }

  async createCategory(name: string): Promise<AdminCategoryItem> {
    const trimmed = name.trim();
    if (!trimmed) {
      throw new BadRequestError('Category name is required');
    }

    const slug = slugify(trimmed).replace(/-/g, '_') || 'category';
    const existing = await jobCategoriesRepository.findBySlug(slug);
    if (existing) {
      throw new BadRequestError('A category with this name already exists');
    }

    const saved = await jobCategoriesRepository.save(
      jobCategoriesRepository.create({ slug, name: trimmed }),
    );

    return { id: saved.id, slug: saved.slug, name: saved.name, jobs: 0 };
  }

  async updateCategory(id: string, name: string): Promise<AdminCategoryItem> {
    const trimmed = name.trim();
    if (!trimmed) {
      throw new BadRequestError('Category name is required');
    }

    const category = await jobCategoriesRepository.findById(id);
    if (!category) {
      throw new NotFoundError('Category not found');
    }

    category.name = trimmed;
    const saved = await jobCategoriesRepository.save(category);
    const counts = await jobsRepository.countByCategory();
    const jobs = counts.find((r) => r.category === saved.slug)?.count ?? 0;

    return { id: saved.id, slug: saved.slug, name: saved.name, jobs };
  }

  async deleteCategory(id: string): Promise<void> {
    const category = await jobCategoriesRepository.findById(id);
    if (!category) {
      throw new NotFoundError('Category not found');
    }

    const counts = await jobsRepository.countByCategory();
    const jobs = counts.find((r) => r.category === category.slug)?.count ?? 0;
    if (jobs > 0) {
      throw new BadRequestError('Cannot delete a category that has posted jobs');
    }

    await jobCategoriesRepository.remove(id);
  }
}

export const adminService = new AdminService();
