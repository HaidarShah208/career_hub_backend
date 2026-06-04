import { Request, Response } from 'express';
import { sendSuccess } from '../../shared/utils/api-response';
import { candidatesService } from './candidates.service';

export class CandidatesController {
  /** GET /candidates/profile */
  async getProfile(req: Request, res: Response): Promise<Response> {
    const profile = await candidatesService.getProfile(req.user!.id);
    return sendSuccess(res, profile, 'Profile retrieved');
  }

  /** PUT /candidates/profile */
  async updateProfile(req: Request, res: Response): Promise<Response> {
    const profile = await candidatesService.updateProfile(req.user!.id, req.body);
    return sendSuccess(res, profile, 'Profile updated successfully');
  }
}

export const candidatesController = new CandidatesController();
