import path from 'path';
import { v2 as cloudinary } from 'cloudinary';
import multer, { type Multer } from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import type { NextFunction, Request, Response } from 'express';
import { env } from '../../config/env';
import { AppError, BadRequestError } from '../errors';
import { logger } from '../logger';

/** Whether all three Cloudinary credentials are present. */
export const isCloudinaryConfigured = Boolean(
  env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET,
);

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  });
} else {
  logger.warn('Cloudinary is not configured — file upload endpoints are disabled');
}

export { cloudinary };

/**
 * Express guard that blocks upload routes with a clear 503 when Cloudinary
 * credentials are missing, instead of failing deep inside multer.
 */
export function ensureCloudinaryConfigured(_req: Request, _res: Response, next: NextFunction): void {
  if (!isCloudinaryConfigured) {
    throw new AppError('File uploads are not configured on this server', 503);
  }
  next();
}

const MB = 1024 * 1024;

export type UploadResourceType = 'image' | 'raw';

interface UploaderOptions {
  /** Sub-folder under `career-hub/` in Cloudinary. */
  folder: string;
  resourceType: UploadResourceType;
  allowedMime: string[];
  allowedExt: string[];
  maxSizeMB: number;
}

/**
 * Builds a configured multer instance that streams a single `file` field to
 * Cloudinary, enforcing mime-type, extension, and size limits.
 */
function buildUploader(opts: UploaderOptions): Multer {
  const storage = new CloudinaryStorage({
    cloudinary,
    params: (req: Request) => ({
      folder: `career-hub/${opts.folder}`,
      resource_type: opts.resourceType,
      public_id: `${opts.folder}_${req.user?.id ?? 'anon'}_${Date.now()}`,
    }),
  });

  return multer({
    storage,
    limits: { fileSize: opts.maxSizeMB * MB, files: 1 },
    fileFilter: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
      const mimeOk = opts.allowedMime.includes(file.mimetype);
      const extOk = opts.allowedExt.includes(ext);
      if (!mimeOk || !extOk) {
        cb(
          new BadRequestError(
            `Invalid file type. Allowed formats: ${opts.allowedExt.join(', ').toUpperCase()}`,
          ),
        );
        return;
      }
      cb(null, true);
    },
  });
}

export const avatarUploader = buildUploader({
  folder: 'avatars',
  resourceType: 'image',
  allowedMime: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'],
  allowedExt: ['png', 'jpg', 'jpeg', 'webp'],
  maxSizeMB: 5,
});

export const resumeUploader = buildUploader({
  folder: 'resumes',
  resourceType: 'raw',
  allowedMime: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
  allowedExt: ['pdf', 'doc', 'docx'],
  maxSizeMB: 10,
});

export const companyLogoUploader = buildUploader({
  folder: 'logos',
  resourceType: 'image',
  allowedMime: ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp'],
  allowedExt: ['png', 'jpg', 'jpeg', 'svg', 'webp'],
  maxSizeMB: 5,
});

/**
 * Extracts the Cloudinary `public_id` from a secure URL so the asset can be
 * deleted. For `image` resources the extension is stripped; for `raw` resources
 * (resumes) the extension is part of the public id and is kept.
 */
export function extractPublicId(url: string, resourceType: UploadResourceType): string | null {
  const marker = '/upload/';
  const idx = url.indexOf(marker);
  if (idx === -1) return null;

  let rest = url.slice(idx + marker.length);
  // Drop an optional version segment like `v1700000000/`.
  rest = rest.replace(/^v\d+\//, '');
  // Strip query string if present.
  rest = rest.split('?')[0];

  if (resourceType === 'image') {
    const dot = rest.lastIndexOf('.');
    if (dot !== -1) rest = rest.slice(0, dot);
  }
  return rest || null;
}

/** Best-effort deletion of a previously uploaded asset. Never throws. */
export async function deleteByUrl(
  url: string | null | undefined,
  resourceType: UploadResourceType,
): Promise<void> {
  if (!url || !isCloudinaryConfigured) return;
  const publicId = extractPublicId(url, resourceType);
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
  } catch (err) {
    logger.warn(`Failed to delete Cloudinary asset ${publicId}: ${(err as Error).message}`);
  }
}
