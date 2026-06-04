import { ConflictError, NotFoundError } from '../../shared/errors';
import { companiesRepository, CompaniesRepository } from '../companies/companies.repository';
import { Company } from '../companies/company.entity';
import { EmployerCompanyDto, UpdateEmployerCompanyDto } from './employer.types';

/**
 * Company management scoped to the authenticated employer. Enforces the
 * "one employer = one company" rule and that employers only touch their own
 * company.
 */
export class EmployerCompanyService {
  constructor(private readonly repo: CompaniesRepository = companiesRepository) {}

  /** Returns the employer's company or throws 404 (shared by other services). */
  async getMyCompany(ownerId: string): Promise<Company> {
    const company = await this.repo.findByOwnerId(ownerId);
    if (!company) {
      throw new NotFoundError('You have not created a company yet');
    }
    return company;
  }

  /** POST /employer/company */
  async create(dto: EmployerCompanyDto, ownerId: string): Promise<Company> {
    const existing = await this.repo.findByOwnerId(ownerId);
    if (existing) {
      throw new ConflictError('You already own a company');
    }

    const company = this.repo.create({
      name: dto.name,
      description: dto.description,
      website: dto.website || undefined,
      location: dto.location,
      logo: dto.logo || undefined,
      industry: dto.industry,
      companySize: dto.companySize,
      foundedYear: dto.foundedYear,
      ownerId,
    });
    return this.repo.save(company);
  }

  /** PUT /employer/company */
  async update(dto: UpdateEmployerCompanyDto, ownerId: string): Promise<Company> {
    const company = await this.getMyCompany(ownerId);

    if (dto.name !== undefined) company.name = dto.name;
    if (dto.description !== undefined) company.description = dto.description;
    if (dto.website !== undefined) company.website = dto.website || null;
    if (dto.location !== undefined) company.location = dto.location;
    if (dto.logo !== undefined) company.logo = dto.logo || null;
    if (dto.industry !== undefined) company.industry = dto.industry;
    if (dto.companySize !== undefined) company.companySize = dto.companySize;
    if (dto.foundedYear !== undefined) company.foundedYear = dto.foundedYear;

    return this.repo.save(company);
  }

  /** DELETE /employer/company (cascades to its jobs). */
  async remove(ownerId: string): Promise<void> {
    const company = await this.getMyCompany(ownerId);
    await this.repo.remove(company);
  }
}

export const employerCompanyService = new EmployerCompanyService();
