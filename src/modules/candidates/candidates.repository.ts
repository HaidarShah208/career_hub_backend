import { Repository } from 'typeorm';
import { AppDataSource } from '../../config/database';
import { UserRole } from '../../shared/constants';
import { User } from '../users/user.entity';
import { CandidateProfile } from './candidate-profile.entity';
import { RegisterCandidateData } from './candidates.types';

export class CandidatesRepository {
  private get profiles(): Repository<CandidateProfile> {
    return AppDataSource.getRepository(CandidateProfile);
  }

  /**
   * Creates the candidate User and an (empty) CandidateProfile atomically.
   * If either insert fails the whole registration is rolled back.
   */
  createWithUser(data: RegisterCandidateData): Promise<User> {
    return AppDataSource.transaction(async (manager) => {
      const userRepo = manager.getRepository(User);
      const profileRepo = manager.getRepository(CandidateProfile);

      const user = userRepo.create({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email.toLowerCase(),
        password: data.passwordHash,
        role: UserRole.CANDIDATE,
        isActive: true,
      });
      const savedUser = await userRepo.save(user);

      const profile = profileRepo.create({ userId: savedUser.id, experienceYears: 0 });
      await profileRepo.save(profile);

      return savedUser;
    });
  }

  findByUserId(userId: string): Promise<CandidateProfile | null> {
    return this.profiles.findOne({ where: { userId } });
  }

  create(data: Partial<CandidateProfile>): CandidateProfile {
    return this.profiles.create(data);
  }

  save(profile: CandidateProfile): Promise<CandidateProfile> {
    return this.profiles.save(profile);
  }
}

export const candidatesRepository = new CandidatesRepository();
