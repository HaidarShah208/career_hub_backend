import { ApplicationStatus } from '../../shared/constants';

export interface CreateApplicationDto {
  jobId: string;
}

export interface UpdateApplicationStatusDto {
  status: ApplicationStatus;
  note?: string;
}

export interface ListApplicationsQuery {
  page: number;
  limit: number;
  status?: ApplicationStatus;
  jobId?: string;
  sortOrder: 'ASC' | 'DESC';
}
