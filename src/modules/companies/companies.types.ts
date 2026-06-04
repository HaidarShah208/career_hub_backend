export interface CreateCompanyDto {
  name: string;
  description?: string;
  website?: string;
  location?: string;
  logo?: string;
  industry?: string;
  companySize?: string;
  foundedYear?: number;
  ownerId?: string;
}

export type UpdateCompanyDto = Partial<Omit<CreateCompanyDto, 'ownerId'>> & {
  ownerId?: string;
};

export interface ListCompaniesQuery {
  page: number;
  limit: number;
  search?: string;
  sortOrder: 'ASC' | 'DESC';
}
