import { Request, Response } from 'express';
import { sendSuccess } from '../../shared/utils/api-response';
import { companiesService } from './companies.service';
import { ListCompaniesQuery } from './companies.types';

export class CompaniesController {
  /** POST /companies */
  async create(req: Request, res: Response): Promise<Response> {
    const company = await companiesService.create(req.body, req.user!);
    return sendSuccess(res, company, 'Company created successfully', 201);
  }

  /** GET /companies */
  async list(req: Request, res: Response): Promise<Response> {
    const query = req.query as unknown as ListCompaniesQuery;
    const { items, meta } = await companiesService.list(query);
    return sendSuccess(res, items, 'Companies retrieved', 200, meta);
  }

  /** GET /companies/:id */
  async getById(req: Request, res: Response): Promise<Response> {
    const company = await companiesService.getById(req.params.id);
    return sendSuccess(res, company, 'Company retrieved');
  }

  /** PUT /companies/:id */
  async update(req: Request, res: Response): Promise<Response> {
    const company = await companiesService.update(req.params.id, req.body);
    return sendSuccess(res, company, 'Company updated successfully');
  }

  /** DELETE /companies/:id */
  async remove(req: Request, res: Response): Promise<Response> {
    await companiesService.remove(req.params.id);
    return sendSuccess(res, null, 'Company deleted successfully');
  }
}

export const companiesController = new CompaniesController();
