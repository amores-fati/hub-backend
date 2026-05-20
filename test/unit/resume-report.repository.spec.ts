/* eslint-disable @typescript-eslint/unbound-method */
import { Brackets, Repository } from 'typeorm';
import { CurriculumOrmEntity } from '../../src/adapters/out/orm/curriculum.orm-entity';
import { StudentOrmEntity } from '../../src/adapters/out/orm/student.orm-entity';
import { ResumeReportRepository } from '../../src/adapters/out/repository/resume-report.repository';

describe('ResumeReportRepository', () => {
  let queryBuilder: {
    addOrderBy: jest.Mock;
    andWhere: jest.Mock;
    getMany: jest.Mock;
    innerJoinAndSelect: jest.Mock;
    orderBy: jest.Mock;
  };
  let ormRepository: Repository<CurriculumOrmEntity>;
  let repository: ResumeReportRepository;

  beforeEach(() => {
    queryBuilder = {
      addOrderBy: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
      innerJoinAndSelect: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
    };

    ormRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
    } as unknown as Repository<CurriculumOrmEntity>;

    repository = new ResumeReportRepository(ormRepository);
  });

  it('should find selected resumes preserving requested order', async () => {
    queryBuilder.getMany.mockResolvedValue([
      buildCurriculumOrmEntity({
        id: 'resume-1',
        studentName: 'Ana',
      }),
      buildCurriculumOrmEntity({
        id: 'resume-2',
        studentName: 'Bruno',
        preference: 'Presencial',
        isAvailable: false,
      }),
    ]);

    const result = await repository.findManyByIds(['resume-2', 'resume-1']);

    expect(ormRepository.createQueryBuilder).toHaveBeenCalledWith('curriculum');
    expect(queryBuilder.innerJoinAndSelect).toHaveBeenCalledWith(
      'curriculum.student',
      'student',
    );
    expect(queryBuilder.innerJoinAndSelect).toHaveBeenCalledWith(
      'student.user',
      'user',
      'user.deletedAt IS NULL',
    );
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      'curriculum.id IN (:...ids)',
      { ids: ['resume-2', 'resume-1'] },
    );
    expect(result).toEqual([
      expect.objectContaining({
        id: 'resume-2',
        studentName: 'Bruno',
        preference: 'Presencial',
        isAvailable: false,
      }),
      expect.objectContaining({
        id: 'resume-1',
        studentName: 'Ana',
      }),
    ]);
  });

  it('should return an empty list without querying when selected ids are empty', async () => {
    const result = await repository.findManyByIds([]);

    expect(result).toEqual([]);
    expect(ormRepository.createQueryBuilder).not.toHaveBeenCalled();
  });

  it('should apply report filters and ordering', async () => {
    queryBuilder.getMany.mockResolvedValue([]);

    await repository.findManyByFilters({
      search: '123.456.789-00',
      interestArea: 'Backend',
      preference: 'Remoto',
      status: 'ATIVO',
    });

    expect(queryBuilder.andWhere).toHaveBeenCalledWith(expect.any(Brackets));
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      'student.activityArea ILIKE :interestArea',
      { interestArea: '%Backend%' },
    );
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      'curriculum.preference ILIKE :preference',
      { preference: '%Remoto%' },
    );
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      'curriculum.isAvailable = :isAvailable',
      { isAvailable: true },
    );
    expect(queryBuilder.orderBy).toHaveBeenCalledWith(
      'student.fullName',
      'ASC',
    );
    expect(queryBuilder.addOrderBy).toHaveBeenCalledWith(
      'curriculum.id',
      'ASC',
    );
  });

  it('should apply inactive status filter', async () => {
    queryBuilder.getMany.mockResolvedValue([]);

    await repository.findManyByFilters({ status: 'INATIVO' });

    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      'curriculum.isAvailable = :isAvailable',
      { isAvailable: false },
    );
  });
});

function buildCurriculumOrmEntity({
  id,
  studentName,
  cpf = '12345678900',
  activityArea = 'Backend',
  preference = 'Remoto',
  isAvailable = true,
}: {
  id: string;
  studentName: string;
  cpf?: string;
  activityArea?: string;
  preference?: string;
  isAvailable?: boolean;
}): CurriculumOrmEntity {
  const student = new StudentOrmEntity();
  student.id = `student-${id}`;
  student.fullName = studentName;
  student.socialName = null;
  student.cpf = cpf;
  student.activityArea = activityArea;

  const curriculum = new CurriculumOrmEntity();
  curriculum.id = id;
  curriculum.student = student;
  curriculum.preference = preference;
  curriculum.isAvailable = isAvailable;
  curriculum.about = 'Resumo profissional';
  curriculum.linkedin = null;
  curriculum.github = null;
  curriculum.profilePhoto = null;
  curriculum.videoPresentation = null;
  curriculum.curriculumSkills = [];

  return curriculum;
}
