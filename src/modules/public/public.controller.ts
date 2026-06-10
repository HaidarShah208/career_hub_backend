import { Request, Response } from 'express';
import { sendSuccess } from '../../shared/utils/api-response';
import { publicService } from './public.service';

export class PublicController {
  /** GET /public/stats */
  async stats(_req: Request, res: Response): Promise<Response> {
    const data = await publicService.getStats();
    return sendSuccess(res, data, 'Platform stats');
  }
}

export const publicController = new PublicController();
