import { adminRepository, AdminRepository } from './admin.repository';
import { DashboardStats } from './admin.types';

export class AdminService {
  constructor(private readonly repo: AdminRepository = adminRepository) {}

  /** GET /admin/dashboard */
  getDashboard(): Promise<DashboardStats> {
    return this.repo.getDashboardStats();
  }
}

export const adminService = new AdminService();
