import { Request, Response } from 'express';
import { sendSuccess } from '../../shared/utils/api-response';
import { authService } from '../auth/auth.service';

export class EmployerAuthController {
  /** POST /employers/signup */
  async signUp(req: Request, res: Response): Promise<Response> {
    const result = await authService.registerEmployer(req.body);
    return sendSuccess(res, result, 'Employer account created successfully', 201);
  }

  /** POST /employers/signin */
  async signIn(req: Request, res: Response): Promise<Response> {
    const result = await authService.signInEmployer(req.body);
    return sendSuccess(res, result, 'Signed in successfully');
  }
}

export const employerAuthController = new EmployerAuthController();
