import { Request, Response } from 'express';
import { sendSuccess } from '../../shared/utils/api-response';
import { authService } from './auth.service';

export class AuthController {
  /** POST /auth/signup */
  async signUp(req: Request, res: Response): Promise<Response> {
    const result = await authService.signUp(req.body);
    return sendSuccess(res, result, result.message, 201);
  }

  /** POST /auth/verify-email */
  async verifyEmail(req: Request, res: Response): Promise<Response> {
    const result = await authService.verifyEmail(req.body.token);
    return sendSuccess(res, result, result.message);
  }

  /** POST /auth/resend-verification */
  async resendVerification(req: Request, res: Response): Promise<Response> {
    const result = await authService.resendVerification(req.body.email);
    return sendSuccess(res, result, result.message);
  }

  /** POST /auth/signin */
  async signIn(req: Request, res: Response): Promise<Response> {
    const result = await authService.signIn(req.body);
    return sendSuccess(res, result, 'Signed in successfully');
  }

  /** POST /auth/refresh */
  async refresh(req: Request, res: Response): Promise<Response> {
    const tokens = await authService.refresh(req.body.refreshToken);
    return sendSuccess(res, tokens, 'Token refreshed successfully');
  }

  /** POST /auth/logout */
  async logout(req: Request, res: Response): Promise<Response> {
    await authService.logout(req.user!.id);
    return sendSuccess(res, null, 'Logged out successfully');
  }

  /** GET /auth/me */
  async me(req: Request, res: Response): Promise<Response> {
    const user = await authService.me(req.user!.id);
    return sendSuccess(res, user, 'Current user retrieved');
  }
}

export const authController = new AuthController();
