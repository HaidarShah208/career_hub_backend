import { ILike, Repository } from 'typeorm';
import { AppDataSource } from '../../config/database';
import { Company } from './company.entity';
import { CreateCompanyDto, ListCompaniesQuery } from './companies.types';

export class CompaniesRepository {
  private get repo(): Repository<Company> {
    return AppDataSource.getRepository(Company);
  }

  create(data: CreateCompanyDto & { ownerId: string }): Company {
    return this.repo.create(data);
  }

  save(company: Company): Promise<Company> {
    return this.repo.save(company);
  }

  findById(id: string): Promise<Company | null> {
    return this.repo.findOne({ where: { id }, relations: { jobs: true } });
  }

  findByOwnerId(ownerId: string): Promise<Company | null> {
    return this.repo.findOne({ where: { ownerId } });
  }

  async remove(company: Company): Promise<void> {
    await this.repo.remove(company);
  }

  async findAndCount(query: ListCompaniesQuery): Promise<[Company[], number]> {
    const { page, limit, search, sortOrder } = query;
    return this.repo.findAndCount({
      where: search ? { name: ILike(`%${search}%`) } : {},
      order: { createdAt: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  count(): Promise<number> {
    return this.repo.count();
  }

  countUnverified(): Promise<number> {
    return this.repo.count({ where: { isVerified: false } });
  }

  findUnverified(limit = 50): Promise<Company[]> {
    return this.repo.find({
      where: { isVerified: false },
      relations: { owner: true },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async setVerified(id: string, isVerified: boolean): Promise<Company | null> {
    await this.repo.update({ id }, { isVerified });
    return this.findById(id);
  }
}

export const companiesRepository = new CompaniesRepository();
