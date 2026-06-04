import { Router } from 'express';
import { UserRole } from '../../shared/constants';
import { authenticate, authorize } from '../../shared/middleware';
import {
  avatarUploader,
  companyLogoUploader,
  ensureCloudinaryConfigured,
  resumeUploader,
} from '../../shared/services/cloudinary.service';
import { asyncHandler } from '../../shared/utils/async-handler';
import { uploadsController } from './uploads.controller';

const router = Router();

/**
 * @openapi
 * /uploads/avatar:
 *   post:
 *     tags: [Uploads]
 *     summary: Upload candidate avatar (PNG, JPG, JPEG, WEBP — max 5MB)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file: { type: string, format: binary }
 *     responses:
 *       201: { description: Avatar uploaded }
 *   delete:
 *     tags: [Uploads]
 *     summary: Remove candidate avatar
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Avatar removed }
 */
router.post(
  '/avatar',
  authenticate,
  authorize(UserRole.CANDIDATE),
  ensureCloudinaryConfigured,
  avatarUploader.single('file'),
  asyncHandler(uploadsController.uploadAvatar.bind(uploadsController)),
);
router.delete(
  '/avatar',
  authenticate,
  authorize(UserRole.CANDIDATE),
  asyncHandler(uploadsController.deleteAvatar.bind(uploadsController)),
);

/**
 * @openapi
 * /uploads/resume:
 *   post:
 *     tags: [Uploads]
 *     summary: Upload candidate resume (PDF, DOC, DOCX — max 10MB)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file: { type: string, format: binary }
 *     responses:
 *       201: { description: Resume uploaded }
 *   delete:
 *     tags: [Uploads]
 *     summary: Remove candidate resume
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Resume removed }
 */
router.post(
  '/resume',
  authenticate,
  authorize(UserRole.CANDIDATE),
  ensureCloudinaryConfigured,
  resumeUploader.single('file'),
  asyncHandler(uploadsController.uploadResume.bind(uploadsController)),
);
router.delete(
  '/resume',
  authenticate,
  authorize(UserRole.CANDIDATE),
  asyncHandler(uploadsController.deleteResume.bind(uploadsController)),
);

/**
 * @openapi
 * /uploads/company-logo:
 *   post:
 *     tags: [Uploads]
 *     summary: Upload company logo (PNG, JPG, SVG, WEBP — max 5MB)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file: { type: string, format: binary }
 *     responses:
 *       201: { description: Logo uploaded }
 *   delete:
 *     tags: [Uploads]
 *     summary: Remove company logo
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Logo removed }
 */
router.post(
  '/company-logo',
  authenticate,
  authorize(UserRole.EMPLOYER, UserRole.ADMIN),
  ensureCloudinaryConfigured,
  companyLogoUploader.single('file'),
  asyncHandler(uploadsController.uploadCompanyLogo.bind(uploadsController)),
);
router.delete(
  '/company-logo',
  authenticate,
  authorize(UserRole.EMPLOYER, UserRole.ADMIN),
  asyncHandler(uploadsController.deleteCompanyLogo.bind(uploadsController)),
);

export default router;
