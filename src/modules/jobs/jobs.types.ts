import { EmploymentType, JobStatus } from '../../shared/constants';

export interface CreateJobDto {
  title: string;
  description: string;
  location?: string;
  employmentType?: EmploymentType;
  salaryMin?: number;
  salaryMax?: number;
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
  salaryMin?: number;
  salaryMax?: number;
  sortOrder: 'ASC' | 'DESC';
}
