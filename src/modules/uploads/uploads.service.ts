import { NotFoundError } from '../../shared/errors';
import { deleteByUrl } from '../../shared/services/cloudinary.service';
import { candidatesRepository } from '../candidates/candidates.repository';
import { candidatesService } from '../candidates/candidates.service';
import { companiesRepository } from '../companies/companies.repository';

export class UploadsService {
  /** Replaces the candidate avatar, deleting any previous one. */
  async setAvatar(userId: string, url: string): Promise<string> {
    const profile = await candidatesService.getProfile(userId);
    await deleteByUrl(profile.avatarUrl, 'image');
    profile.avatarUrl = url;
    await candidatesRepository.save(profile);
    return url;
  }

  async removeAvatar(userId: string): Promise<void> {
    const profile = await candidatesService.getProfile(userId);
    await deleteByUrl(profile.avatarUrl, 'image');
    profile.avatarUrl = null;
    await candidatesRepository.save(profile);
  }

  /** Replaces the candidate resume, deleting any previous one. */
  async setResume(userId: string, url: string): Promise<string> {
    const profile = await candidatesService.getProfile(userId);
    await deleteByUrl(profile.resumeUrl, 'raw');
    profile.resumeUrl = url;
    await candidatesRepository.save(profile);
    return url;
  }

  async removeResume(userId: string): Promise<void> {
    const profile = await candidatesService.getProfile(userId);
    await deleteByUrl(profile.resumeUrl, 'raw');
    profile.resumeUrl = null;
    await candidatesRepository.save(profile);
  }

  /** Replaces the employer's company logo (requires an existing company). */
  async setCompanyLogo(userId: string, url: string): Promise<string> {
    const company = await companiesRepository.findByOwnerId(userId);
    if (!company) {
      throw new NotFoundError('Create your company profile before uploading a logo');
    }
    await deleteByUrl(company.logo, 'image');
    company.logo = url;
    await companiesRepository.save(company);
    return url;
  }

  async removeCompanyLogo(userId: string): Promise<void> {
    const company = await companiesRepository.findByOwnerId(userId);
    if (!company) {
      throw new NotFoundError('No company found for this account');
    }
    await deleteByUrl(company.logo, 'image');
    company.logo = null;
    await companiesRepository.save(company);
  }
}

export const uploadsService = new UploadsService();
