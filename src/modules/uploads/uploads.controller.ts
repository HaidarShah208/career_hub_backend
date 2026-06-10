import { Request, Response } from 'express';
import { BadRequestError } from '../../shared/errors';
import { sendSuccess } from '../../shared/utils/api-response';
import { uploadsService } from './uploads.service';

function fileUrl(req: Request): string {
  // multer-storage-cloudinary sets `path` to the uploaded secure URL.
  const url = req.file?.path;
  if (!url) throw new BadRequestError('No file uploaded. Attach a file in the "file" field.');
  return url;
}

export class UploadsController {
  /** POST /uploads/avatar */
  async uploadAvatar(req: Request, res: Response): Promise<Response> {
    const avatarUrl = await uploadsService.setAvatar(req.user!.id, fileUrl(req));
    return sendSuccess(res, { avatarUrl }, 'Avatar uploaded successfully', 201);
  }

  /** DELETE /uploads/avatar */
  async deleteAvatar(req: Request, res: Response): Promise<Response> {
    await uploadsService.removeAvatar(req.user!.id);
    return sendSuccess(res, { avatarUrl: null }, 'Avatar removed');
  }

  /** POST /uploads/resume */
  async uploadResume(req: Request, res: Response): Promise<Response> {
    const resumeUrl = await uploadsService.setResume(req.user!.id, fileUrl(req));
    return sendSuccess(res, { resumeUrl }, 'Resume uploaded successfully', 201);
  }

  /** DELETE /uploads/resume */
  async deleteResume(req: Request, res: Response): Promise<Response> {
    await uploadsService.removeResume(req.user!.id);
    return sendSuccess(res, { resumeUrl: null }, 'Resume removed');
  }

  /** POST /uploads/company-logo */
  async uploadCompanyLogo(req: Request, res: Response): Promise<Response> {
    const logoUrl = await uploadsService.setCompanyLogo(req.user!.id, fileUrl(req));
    return sendSuccess(res, { logoUrl }, 'Company logo uploaded successfully', 201);
  }

  /** DELETE /uploads/company-logo */
  async deleteCompanyLogo(req: Request, res: Response): Promise<Response> {
    await uploadsService.removeCompanyLogo(req.user!.id);
    return sendSuccess(res, { logoUrl: null }, 'Company logo removed');
  }

  /** POST /uploads/payment-proof */
  async uploadPaymentProof(req: Request, res: Response): Promise<Response> {
    return sendSuccess(res, { screenshotUrl: fileUrl(req) }, 'Payment proof uploaded', 201);
  }

  /** POST /uploads/verification-document */
  async uploadVerificationDocument(req: Request, res: Response): Promise<Response> {
    const documents = await uploadsService.addVerificationDocument(req.user!.id, fileUrl(req));
    return sendSuccess(res, { verificationDocuments: documents }, 'Verification document uploaded', 201);
  }
}

export const uploadsController = new UploadsController();
