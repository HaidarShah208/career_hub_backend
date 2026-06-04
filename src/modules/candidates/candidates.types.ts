export interface RegisterCandidateData {
  firstName: string;
  lastName: string;
  email: string;
  passwordHash: string;
}

export interface UpdateProfileDto {
  headline?: string;
  bio?: string;
  skills?: string[];
  experienceYears?: number;
  city?: string;
  resumeUrl?: string;
}
