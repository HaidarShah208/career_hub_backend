import { Request, Response } from 'express';
import { sendSuccess } from '../../shared/utils/api-response';
import { applicationsService } from './applications.service';
import { ListApplicationsQuery } from './applications.types';

export class ApplicationsController {
  /** POST /applications */
  async create(req: Request, res: Response): Promise<Response> {
    const application = await applicationsService.create(req.body, req.user!);
    return sendSuccess(res, application, 'Application submitted successfully', 201);
  }

  /** GET /applications */
  async list(req: Request, res: Response): Promise<Response> {
    const query = req.query as unknown as ListApplicationsQuery;
    const { items, meta } = await applicationsService.list(query, req.user!);
    return sendSuccess(res, items, 'Applications retrieved', 200, meta);
  }

  /** GET /applications/my */
  async listMine(req: Request, res: Response): Promise<Response> {
    const query = req.query as unknown as ListApplicationsQuery;
    const { items, meta } = await applicationsService.listMine(query, req.user!.id);
    return sendSuccess(res, items, 'Your applications retrieved', 200, meta);
  }

  /** GET /applications/:id */
  async getById(req: Request, res: Response): Promise<Response> {
    const application = await applicationsService.getById(req.params.id, req.user!);
    return sendSuccess(res, application, 'Application retrieved');
  }

  /** PATCH /applications/:id/status */
  async updateStatus(req: Request, res: Response): Promise<Response> {
    const application = await applicationsService.updateStatus(req.params.id, req.body, req.user!);
    return sendSuccess(res, application, 'Application status updated');
  }
}

export const applicationsController = new ApplicationsController();
