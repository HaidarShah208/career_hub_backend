import { Request, Response } from 'express';
import { sendSuccess } from '../../shared/utils/api-response';
import { usersService } from './users.service';

export class UsersController {
  /** GET /users/me */
  async me(req: Request, res: Response): Promise<Response> {
    const user = await usersService.getById(req.user!.id);
    return sendSuccess(res, user, 'Current user retrieved');
  }

  /** DELETE /users/me — permanently deletes the account and related data. */
  async deleteMe(req: Request, res: Response): Promise<Response> {
    await usersService.deleteAccount(req.user!.id);
    return sendSuccess(res, null, 'Account deleted successfully');
  }
}

export const usersController = new UsersController();
