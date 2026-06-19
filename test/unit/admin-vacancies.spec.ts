import { Brackets, Repository } from 'typeorm';
import { VacancyReportRepository } from '../../src/adapters/out/repository/vacancy-report.repository';
import { JobOpeningOrmEntity } from '../../src/adapters/out/orm/job-opening.orm-entity';
import { CompanyOrmEntity } from '../../src/adapters/out/orm/company.orm-entity';
import { AdminVacancyFilters } from '../../src/core/ports/vacancy-report.repository.interface';

describe('VacancyReportRepository.findAllForAdmin', () => {
  let queryBuilder: {
    innerJoinAndSelect: jest.Mock;
    andWhere: jest.Mock;
    getCount: jest.Mock;
    orderBy: jest.Mock;
    addOrderBy: jest.Mock;
    skip: jest.Mock;
    take: jest.Mock;
    getMany: jest.Mock;
  };
  let ormRepository: Repository<JobOpeningOrmEntity>;
  let repository: VacancyReportRepository;

  beforeEach(() => {
    queryBuilder = {
      innerJoinAndSelect: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getCount: jest.fn().mockResolvedValue(0),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    };

    ormRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
      find: jest.fn(),
      delete: jest.fn(),
      findOne: jest.fn(),
    } as unknown as Repository<JobOpeningOrmEntity>;

    repository = new VacancyReportRepository(ormRepository);
  });

  it('deve retornar 5 vagas e o total correto com paginação page=1&limit=5', async () => {
    const vacancies = buildVacancyList(5);
    queryBuilder.getCount.mockResolvedValue(245);
    queryBuilder.getMany.mockResolvedValue(vacancies);

    const filters: AdminVacancyFilters = { page: 1, limit: 5 };
    const result = await repository.findAllForAdmin(filters);

    expect(result.total).toBe(245);
    expect(result.items).toHaveLength(5);
    expect(queryBuilder.skip).toHaveBeenCalledWith(0);
    expect(queryBuilder.take).toHaveBeenCalledWith(5);
  });

  it('deve retornar apenas vagas PCD quando isPcd=true', async () => {
    queryBuilder.getCount.mockResolvedValue(3);
    queryBuilder.getMany.mockResolvedValue([
      buildVacancyOrmEntity({ id: 'v1', name: 'Vaga PCD', isPcd: true }),
    ]);

    const filters: AdminVacancyFilters = { isPcd: true, page: 1, limit: 10 };
    await repository.findAllForAdmin(filters);

    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      'vacancy.isPcd = :isPcd',
      { isPcd: true },
    );
  });

  it('deve retornar apenas vagas presenciais quando workType=presencial', async () => {
    queryBuilder.getCount.mockResolvedValue(2);
    queryBuilder.getMany.mockResolvedValue([
      buildVacancyOrmEntity({
        id: 'v2',
        name: 'Vaga Presencial',
        workplaceType: 'presencial',
      }),
    ]);

    const filters: AdminVacancyFilters = {
      workType: 'presencial',
      page: 1,
      limit: 10,
    };
    await repository.findAllForAdmin(filters);

    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      'vacancy.workplaceType ILIKE :workType',
      { workType: 'presencial' },
    );
  });

  it('deve aplicar busca textual case-insensitive no título e empresa', async () => {
    queryBuilder.getCount.mockResolvedValue(1);
    queryBuilder.getMany.mockResolvedValue([
      buildVacancyOrmEntity({ id: 'v3', name: 'Estagiário Frontend' }),
    ]);

    const filters: AdminVacancyFilters = {
      search: 'estagiário',
      page: 1,
      limit: 10,
    };
    await repository.findAllForAdmin(filters);

    expect(queryBuilder.andWhere).toHaveBeenCalledWith(expect.any(Brackets));
  });

  it('deve mapear os campos corretamente no item retornado', async () => {
    const announcementDate = '2026-01-15';
    const vacancy = buildVacancyOrmEntity({
      id: 'v4',
      name: 'Dev Backend',
      isPcd: false,
      openingsCount: 2,
      workplaceType: 'online',
      announcementDate,
    });
    queryBuilder.getCount.mockResolvedValue(1);
    queryBuilder.getMany.mockResolvedValue([vacancy]);

    const result = await repository.findAllForAdmin({ page: 1, limit: 10 });

    expect(result.items[0]).toMatchObject({
      id: 'v4',
      name: 'Dev Backend',
      companyName: 'Empresa Teste',
      openingsCount: 2,
      isPcd: false,
      workplaceType: 'online',
      announcementDate: new Date(`${announcementDate}T00:00:00.000Z`),
    });
  });

  it('não deve aplicar filtros quando nenhum é fornecido', async () => {
    const filters: AdminVacancyFilters = { page: 1, limit: 10 };
    await repository.findAllForAdmin(filters);

    expect(queryBuilder.andWhere).not.toHaveBeenCalled();
  });
});

function buildVacancyList(count: number): JobOpeningOrmEntity[] {
  return Array.from({ length: count }, (_, i) =>
    buildVacancyOrmEntity({ id: `v${i + 1}`, name: `Vaga ${i + 1}` }),
  );
}

function buildVacancyOrmEntity({
  id,
  name,
  openingsCount = 1,
  isPcd = false,
  workplaceType = 'presencial',
  announcementDate = '2026-01-15',
  companyName = 'Empresa Teste',
}: {
  id: string;
  name: string;
  openingsCount?: number;
  isPcd?: boolean;
  workplaceType?: string;
  announcementDate?: string;
  companyName?: string;
}): JobOpeningOrmEntity {
  const company = new CompanyOrmEntity();
  company.id = 'company-1';
  company.name = companyName;

  const entity = new JobOpeningOrmEntity();
  entity.id = id;
  entity.name = name;
  entity.openingsCount = openingsCount;
  entity.isPcd = isPcd;
  entity.workplaceType = workplaceType;
  entity.announcementDate = announcementDate as unknown as Date;
  entity.company = company;

  return entity;
}
