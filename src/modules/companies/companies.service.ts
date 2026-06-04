import { NotFoundError } from '../../shared/errors';
import { AuthUser } from '../../shared/types';
import { buildPaginationMeta, PaginationMeta } from '../../shared/utils/pagination';
import { usersRepository } from '../users/users.repository';
import { companiesRepository, CompaniesRepository } from './companies.repository';
import { Company } from './company.entity';
import { CreateCompanyDto, ListCompaniesQuery, UpdateCompanyDto } from './companies.types';

export class CompaniesService {
  constructor(private readonly repo: CompaniesRepository = companiesRepository) {}

  /** POST /companies */
  async create(dto: CreateCompanyDto, actor: AuthUser): Promise<Company> {
    // The owner defaults to the creating admin, but an explicit ownerId may be
    // supplied to register a company on behalf of another user.
    const ownerId = dto.ownerId ?? actor.id;

    const owner = await usersRepository.findById(ownerId);
    if (!owner) {
      throw new NotFoundError('Owner user not found');
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

  /** PUT /companies/:id */
  async update(id: string, dto: UpdateCompanyDto): Promise<Company> {
    const company = await this.getById(id);

    if (dto.ownerId !== undefined) {
      const owner = await usersRepository.findById(dto.ownerId);
      if (!owner) {
        throw new NotFoundError('Owner user not found');
      }
      company.ownerId = dto.ownerId;
    }
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

  /** DELETE /companies/:id (cascades to its jobs). */
  async remove(id: string): Promise<void> {
    const company = await this.getById(id);
    await this.repo.remove(company);
  }

  /** GET /companies */
  async list(query: ListCompaniesQuery): Promise<{ items: Company[]; meta: PaginationMeta }> {
    const [items, total] = await this.repo.findAndCount(query);
    return { items, meta: buildPaginationMeta(total, query.page, query.limit) };
  }

  /** GET /companies/:id */
  async getById(id: string): Promise<Company> {
    const company = await this.repo.findById(id);
    if (!company) {
      throw new NotFoundError('Company not found');
    }
    return company;
  }
}

export const companiesService = new CompaniesService();
