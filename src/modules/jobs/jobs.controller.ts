import { Request, Response } from 'express';
import { sendSuccess } from '../../shared/utils/api-response';
import { jobsService } from './jobs.service';
import { ListJobsQuery } from './jobs.types';

export class JobsController {
  /** GET /jobs */
  async list(req: Request, res: Response): Promise<Response> {
    const query = req.query as unknown as ListJobsQuery;
    const { items, meta } = await jobsService.list(query);
    return sendSuccess(res, items, 'Jobs retrieved', 200, meta);
  }

  /** GET /jobs/:id */
  async getById(req: Request, res: Response): Promise<Response> {
    const job = await jobsService.getById(req.params.id);
    return sendSuccess(res, job, 'Job retrieved');
  }

  /** POST /jobs/:id/view */
  async recordView(req: Request, res: Response): Promise<Response> {
    const result = await jobsService.recordView(req.params.id);
    return sendSuccess(res, result, 'View recorded');
  }

  /** POST /jobs */
  async create(req: Request, res: Response): Promise<Response> {
    const job = await jobsService.create(req.body);
    return sendSuccess(res, job, 'Job created successfully', 201);
  }

  /** PUT /jobs/:id */
  async update(req: Request, res: Response): Promise<Response> {
    const job = await jobsService.update(req.params.id, req.body);
    return sendSuccess(res, job, 'Job updated successfully');
  }

  /** DELETE /jobs/:id */
  async remove(req: Request, res: Response): Promise<Response> {
    await jobsService.remove(req.params.id);
    return sendSuccess(res, null, 'Job deleted successfully');
  }
}

export const jobsController = new JobsController();
