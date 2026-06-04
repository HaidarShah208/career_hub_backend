import { EmploymentType, JobStatus } from '../../shared/constants';

export interface EmployerCompanyDto {
  name: string;
  logo?: string;
  website?: string;
  description?: string;
  industry?: string;
  companySize?: string;
  foundedYear?: number;
  location?: string;
}

export type UpdateEmployerCompanyDto = Partial<EmployerCompanyDto>;

export interface EmployerJobDto {
  title: string;
  description: string;
  location?: string;
  employmentType?: EmploymentType;
  salaryMin?: number;
  salaryMax?: number;
  category?: string;
  experienceLevel?: string;
  skills?: string[];
  applyMethod?: 'internal' | 'external';
  applyUrl?: string;
  isUrgent?: boolean;
  isFeatured?: boolean;
  status?: JobStatus;
}

export type UpdateEmployerJobDto = Partial<EmployerJobDto>;
