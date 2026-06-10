import { Request, Response } from 'express';
import { sendSuccess } from '../../shared/utils/api-response';
import { applicationsService } from '../applications/applications.service';
import { ListApplicationsQuery } from '../applications/applications.types';
import { companiesService } from '../companies/companies.service';
import { ListCompaniesQuery } from '../companies/companies.types';
import { jobsService } from '../jobs/jobs.service';
import { ListJobsQuery } from '../jobs/jobs.types';
import { ListUsersQuery } from '../users/users.types';
import { adminService } from './admin.service';

export class AdminController {
  /** GET /admin/dashboard */
  async dashboard(_req: Request, res: Response): Promise<Response> {
    const stats = await adminService.getDashboard();
    return sendSuccess(res, stats, 'Dashboard metrics retrieved');
  }

  /** GET /admin/users */
  async users(req: Request, res: Response): Promise<Response> {
    const query = req.query as unknown as ListUsersQuery;
    const { items, meta } = await adminService.listUsers(query, req.user!.id);
    return sendSuccess(res, items, 'Users retrieved', 200, meta);
  }

  /** PATCH /admin/users/:id/status */
  async updateUserStatus(req: Request, res: Response): Promise<Response> {
    const user = await adminService.updateUserStatus(
      req.params.id,
      req.body.isActive,
      req.user!.id,
    );
    return sendSuccess(res, user, 'User status updated');
  }

  /** GET /admin/employers/pending */
  async pendingEmployers(_req: Request, res: Response): Promise<Response> {
    const items = await adminService.listPendingEmployers();
    return sendSuccess(res, items, 'Pending employers retrieved');
  }

  /** PATCH /admin/companies/:id/verification */
  async verifyCompany(req: Request, res: Response): Promise<Response> {
    await adminService.verifyCompany(req.params.id, req.body.verified);
    return sendSuccess(res, null, req.body.verified ? 'Company approved' : 'Company rejected');
  }

  /** GET /admin/analytics */
  async analytics(_req: Request, res: Response): Promise<Response> {
    const data = await adminService.getSiteAnalytics();
    return sendSuccess(res, data, 'Site analytics retrieved');
  }

  /** GET /admin/revenue */
  async revenue(_req: Request, res: Response): Promise<Response> {
    const data = await adminService.getRevenue();
    return sendSuccess(res, data, 'Revenue data retrieved');
  }

  /** GET /admin/jobs */
  async jobs(req: Request, res: Response): Promise<Response> {
    const query = req.query as unknown as ListJobsQuery;
    const { items, meta } = await jobsService.list(query);
    return sendSuccess(res, items, 'Jobs retrieved', 200, meta);
  }

  /** GET /admin/applications */
  async applications(req: Request, res: Response): Promise<Response> {
    const query = req.query as unknown as ListApplicationsQuery;
    const { items, meta } = await applicationsService.list(query, req.user!);
    return sendSuccess(res, items, 'Applications retrieved', 200, meta);
  }

  /** GET /admin/companies */
  async companies(req: Request, res: Response): Promise<Response> {
    const query = req.query as unknown as ListCompaniesQuery;
    const { items, meta } = await companiesService.list(query);
    return sendSuccess(res, items, 'Companies retrieved', 200, meta);
  }
}

export const adminController = new AdminController();
