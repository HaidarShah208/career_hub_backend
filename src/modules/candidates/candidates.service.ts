import { candidatesRepository, CandidatesRepository } from './candidates.repository';
import { CandidateProfile } from './candidate-profile.entity';
import { UpdateProfileDto } from './candidates.types';

export class CandidatesService {
  constructor(private readonly repo: CandidatesRepository = candidatesRepository) {}

  /** Returns the candidate's profile, creating an empty one if none exists. */
  async getProfile(userId: string): Promise<CandidateProfile> {
    const existing = await this.repo.findByUserId(userId);
    if (existing) return existing;
    const profile = this.repo.create({ userId, experienceYears: 0 });
    return this.repo.save(profile);
  }

  /** PUT /candidates/profile */
  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<CandidateProfile> {
    const profile = await this.getProfile(userId);

    if (dto.headline !== undefined) profile.headline = dto.headline;
    if (dto.bio !== undefined) profile.bio = dto.bio;
    if (dto.skills !== undefined) profile.skills = dto.skills;
    if (dto.experienceYears !== undefined) profile.experienceYears = dto.experienceYears;
    if (dto.city !== undefined) profile.city = dto.city;
    if (dto.resumeUrl !== undefined) profile.resumeUrl = dto.resumeUrl || null;

    return this.repo.save(profile);
  }
}

export const candidatesService = new CandidatesService();
