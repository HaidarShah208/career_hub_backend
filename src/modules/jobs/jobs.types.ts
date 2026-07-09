import { EmploymentType, JobStatus } from '../../shared/constants';

export interface CreateJobDto {
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
  companyId: string;
}

export type UpdateJobDto = Partial<Omit<CreateJobDto, 'companyId'>> & {
  companyId?: string;
};

export interface ListJobsQuery {
  page: number;
  limit: number;
  search?: string;
  status?: JobStatus;
  employmentType?: EmploymentType;
  companyId?: string;
  location?: string;
  city?: string;
  category?: string;
  experienceLevel?: string;
  salaryMin?: number;
  salaryMax?: number;
  sortOrder: 'ASC' | 'DESC';
}
