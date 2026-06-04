import { Request, Response } from 'express';
import { sendSuccess } from '../../shared/utils/api-response';
import { applicationsService } from '../applications/applications.service';
import { ListApplicationsQuery } from '../applications/applications.types';
import { companiesService } from '../companies/companies.service';
import { ListCompaniesQuery } from '../companies/companies.types';
import { jobsService } from '../jobs/jobs.service';
import { ListJobsQuery } from '../jobs/jobs.types';
import { adminService } from './admin.service';

export class AdminController {
  /** GET /admin/dashboard */
  async dashboard(_req: Request, res: Response): Promise<Response> {
    const stats = await adminService.getDashboard();
    return sendSuccess(res, stats, 'Dashboard metrics retrieved');
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
