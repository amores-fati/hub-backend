/* eslint-disable @typescript-eslint/unbound-method */
import { Brackets, Repository } from 'typeorm';
import { VacancyReportRepository } from '../../src/adapters/out/repository/vacancy-report.repository';
import { JobOpeningOrmEntity } from '../../src/adapters/out/orm/job-opening.orm-entity';

describe('VacancyReportRepository', () => {
  let queryBuilder: {
    addOrderBy: jest.Mock;
    andWhere: jest.Mock;
    getMany: jest.Mock;
    orderBy: jest.Mock;
  };
  let ormRepository: Repository<JobOpeningOrmEntity>;
  let repository: VacancyReportRepository;

  beforeEach(() => {
    queryBuilder = {
      addOrderBy: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
      orderBy: jest.fn().mockReturnThis(),
    };

    ormRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
      find: jest.fn(),
    } as unknown as Repository<JobOpeningOrmEntity>;

    repository = new VacancyReportRepository(ormRepository);
  });

  it('should find selected vacancies preserving requested order', async () => {
    (ormRepository.find as jest.Mock).mockResolvedValue([
      buildVacancyOrmEntity({
        id: 'vacancy-1',
        name: 'Primeira Vaga',
      }),
      buildVacancyOrmEntity({
        id: 'vacancy-2',
        name: 'Segunda Vaga',
        announcementDate: '2026-04-24',
      }),
    ]);

    const result = await repository.findManyByIds(['vacancy-2', 'vacancy-1']);

    expect(ormRepository.find).toHaveBeenCalledTimes(1);
    expect(result).toEqual([
      expect.objectContaining({
        id: 'vacancy-2',
        name: 'Segunda Vaga',
        announcementDate: new Date('2026-04-24T00:00:00.000Z'),
      }),
      expect.objectContaining({
        id: 'vacancy-1',
        name: 'Primeira Vaga',
      }),
    ]);
  });

  it('should return an empty list without querying when selected ids are empty', async () => {
    const result = await repository.findManyByIds([]);

    expect(result).toEqual([]);
    expect(ormRepository.find).not.toHaveBeenCalled();
  });

  it('should apply report filters and ordering', async () => {
    queryBuilder.getMany.mockResolvedValue([
      buildVacancyOrmEntity({
        id: 'vacancy-1',
        name: 'Desenvolvedor Frontend',
      }),
    ]);

    await repository.findManyByFilters({
      search: 'Frontend',
      isPcd: false,
      dateFrom: '2026-04-01',
      dateTo: '2026-04-30',
    });

    expect(ormRepository.createQueryBuilder).toHaveBeenCalledWith('vacancy');
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(expect.any(Brackets));
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      'vacancy.isPcd = :isPcd',
      { isPcd: false },
    );
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      'vacancy.announcementDate >= :dateFrom',
      { dateFrom: '2026-04-01' },
    );
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      'vacancy.announcementDate <= :dateTo',
      { dateTo: '2026-04-30' },
    );
    expect(queryBuilder.orderBy).toHaveBeenCalledWith(
      'vacancy.announcementDate',
      'DESC',
    );
    expect(queryBuilder.addOrderBy).toHaveBeenCalledWith('vacancy.name', 'ASC');
  });

  it('should apply the PCD filter when the value is true', async () => {
    queryBuilder.getMany.mockResolvedValue([]);

    await repository.findManyByFilters({ isPcd: true });

    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      'vacancy.isPcd = :isPcd',
      { isPcd: true },
    );
  });
});

function buildVacancyOrmEntity({
  id,
  name,
  openingsCount = 2,
  isPcd = true,
  announcementDate = '2026-04-23',
}: {
  id: string;
  name: string;
  openingsCount?: number;
  isPcd?: boolean;
  announcementDate?: string;
}): JobOpeningOrmEntity {
  const ormEntity = new JobOpeningOrmEntity();
  ormEntity.id = id;
  ormEntity.name = name;
  ormEntity.description = 'Descricao da vaga';
  ormEntity.openingsCount = openingsCount;
  ormEntity.applicationLink = null;
  ormEntity.isPcd = isPcd;
  ormEntity.announcementDate = announcementDate as unknown as Date;

  return ormEntity;
}
