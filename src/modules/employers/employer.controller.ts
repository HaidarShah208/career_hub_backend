import { Request, Response } from 'express';
import { sendSuccess } from '../../shared/utils/api-response';
import { ListJobsQuery } from '../jobs/jobs.types';
import { ListApplicationsQuery } from '../applications/applications.types';
import { employerApplicantsService } from './employer-applicants.service';
import { employerCompanyService } from './employer-company.service';
import { employerAnalyticsService } from './employer-analytics.service';
import { employerDashboardService } from './employer-dashboard.service';
import { employerJobsService } from './employer-jobs.service';

export class EmployerController {
  // ---- Company ----
  async createCompany(req: Request, res: Response): Promise<Response> {
    const company = await employerCompanyService.create(req.body, req.user!.id);
    return sendSuccess(res, company, 'Company created successfully', 201);
  }

  async getCompany(req: Request, res: Response): Promise<Response> {
    const company = await employerCompanyService.getMyCompany(req.user!.id);
    return sendSuccess(res, company, 'Company retrieved');
  }

  async updateCompany(req: Request, res: Response): Promise<Response> {
    const company = await employerCompanyService.update(req.body, req.user!.id);
    return sendSuccess(res, company, 'Company updated successfully');
  }

  async deleteCompany(req: Request, res: Response): Promise<Response> {
    await employerCompanyService.remove(req.user!.id);
    return sendSuccess(res, null, 'Company deleted successfully');
  }

  // ---- Jobs ----
  async createJob(req: Request, res: Response): Promise<Response> {
    const job = await employerJobsService.create(req.body, req.user!.id);
    return sendSuccess(res, job, 'Job created successfully', 201);
  }

  async listJobs(req: Request, res: Response): Promise<Response> {
    const query = req.query as unknown as Omit<ListJobsQuery, 'companyId'>;
    const { items, meta } = await employerJobsService.list(query, req.user!.id);
    return sendSuccess(res, items, 'Jobs retrieved', 200, meta);
  }

  async getJob(req: Request, res: Response): Promise<Response> {
    const job = await employerJobsService.getById(req.params.id, req.user!.id);
    return sendSuccess(res, job, 'Job retrieved');
  }

  async updateJob(req: Request, res: Response): Promise<Response> {
    const job = await employerJobsService.update(req.params.id, req.body, req.user!.id);
    return sendSuccess(res, job, 'Job updated successfully');
  }

  async deleteJob(req: Request, res: Response): Promise<Response> {
    await employerJobsService.remove(req.params.id, req.user!.id);
    return sendSuccess(res, null, 'Job deleted successfully');
  }

  async publishJob(req: Request, res: Response): Promise<Response> {
    const job = await employerJobsService.publish(req.params.id, req.user!.id);
    return sendSuccess(res, job, 'Job published');
  }

  async closeJob(req: Request, res: Response): Promise<Response> {
    const job = await employerJobsService.close(req.params.id, req.user!.id);
    return sendSuccess(res, job, 'Job closed');
  }

  // ---- Applicants ----
  async listApplicants(req: Request, res: Response): Promise<Response> {
    const query = req.query as unknown as ListApplicationsQuery;
    const { items, meta } = await employerApplicantsService.list(query, req.user!.id);
    return sendSuccess(res, items, 'Applicants retrieved', 200, meta);
  }

  async getApplicant(req: Request, res: Response): Promise<Response> {
    const application = await employerApplicantsService.getById(req.params.id, req.user!.id);
    return sendSuccess(res, application, 'Applicant retrieved');
  }

  async updateApplicationStatus(req: Request, res: Response): Promise<Response> {
    const application = await employerApplicantsService.updateStatus(
      req.params.id,
      req.body,
      req.user!,
    );
    return sendSuccess(res, application, 'Application status updated');
  }

  // ---- Dashboard ----
  async dashboard(req: Request, res: Response): Promise<Response> {
    const data = await employerDashboardService.getDashboard(req.user!.id);
    return sendSuccess(res, data, 'Employer dashboard');
  }

  // ---- Analytics ----
  async analytics(req: Request, res: Response): Promise<Response> {
    const data = await employerAnalyticsService.getAnalytics(req.user!.id);
    return sendSuccess(res, data, 'Employer analytics');
  }
}

export const employerController = new EmployerController();
