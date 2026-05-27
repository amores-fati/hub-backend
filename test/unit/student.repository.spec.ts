import { Brackets, Repository } from 'typeorm';

import { Contact } from '../../src/core/domain/contact.entity';
import { Gender, Race } from '../../src/core/domain/enums/student-profile.enum';
import { Student } from '../../src/core/domain/student.entity';
import { StudentRepository } from '../../src/adapters/out/repository/student.repository';
import { SocialBenefitOrmEntity } from '../../src/adapters/out/orm/social-benefit.orm-entity';
import { StudentOrmEntity } from '../../src/adapters/out/orm/student.orm-entity';
import { UserOrmEntity } from '../../src/adapters/out/orm/user.orm-entity';
import { AddressStudentOrmEntity } from '../../src/adapters/out/orm/address-student.orm-entity';
import { TelephoneStudentOrmEntity } from '../../src/adapters/out/orm/telephone-student.orm-entity';
import { UserRoleEnum } from '../../src/core/domain/enums/user-role.enum';

describe('StudentRepository', () => {
  type TransactionManagerMock = {
    delete: jest.Mock;
    save: jest.Mock;
    update: jest.Mock;
  };
  type TransactionCallback = (
    manager: TransactionManagerMock,
  ) => Promise<unknown>;

  let transactionalEntityManager: {
    delete: jest.Mock;
    save: jest.Mock;
    update: jest.Mock;
    createQueryBuilder: jest.Mock;
  };
  let managerQueryBuilder: {
    delete: jest.Mock;
    from: jest.Mock;
    where: jest.Mock;
    execute: jest.Mock;
  };
  let queryBuilder: {
    addOrderBy: jest.Mock;
    addSelect: jest.Mock;
    andWhere: jest.Mock;
    getMany: jest.Mock;
    getRawMany: jest.Mock;
    getManyAndCount: jest.Mock;
    innerJoin: jest.Mock;
    innerJoinAndSelect: jest.Mock;
    leftJoin: jest.Mock;
    leftJoinAndMapMany: jest.Mock;
    leftJoinAndMapOne: jest.Mock;
    leftJoinAndSelect: jest.Mock;
    orderBy: jest.Mock;
    select: jest.Mock;
    skip: jest.Mock;
    take: jest.Mock;
  };
  let ormRepository: Repository<StudentOrmEntity>;
  let repository: StudentRepository;

  beforeEach(() => {
    managerQueryBuilder = {
      delete: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      execute: jest.fn().mockResolvedValue(undefined),
    };

    transactionalEntityManager = {
      delete: jest.fn().mockResolvedValue(undefined),
      save: jest.fn().mockResolvedValue(undefined),
      update: jest.fn().mockResolvedValue(undefined),
      createQueryBuilder: jest.fn().mockReturnValue(managerQueryBuilder),
    };

    queryBuilder = {
      addOrderBy: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
      getRawMany: jest.fn(),
      getManyAndCount: jest.fn(),
      innerJoin: jest.fn().mockReturnThis(),
      innerJoinAndSelect: jest.fn().mockReturnThis(),
      leftJoin: jest.fn().mockReturnThis(),
      leftJoinAndMapMany: jest.fn().mockReturnThis(),
      leftJoinAndMapOne: jest.fn().mockReturnThis(),
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
    };

    ormRepository = {
      manager: {
        transaction: jest.fn((callback: TransactionCallback) =>
          callback(transactionalEntityManager),
        ),
      },
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
      find: jest.fn(),
      findOne: jest.fn(),
    } as unknown as Repository<StudentOrmEntity>;

    repository = new StudentRepository(ormRepository);
  });

  it('should replace child collections when update receives new items', async () => {
    const student = buildStudent({
      socialBenefitNames: ['OUTROS'],
    });

    (ormRepository.findOne as jest.Mock).mockResolvedValue(
      buildStudentOrmEntity(student, {
        socialBenefitIds: [21],
      }),
    );

    await repository.update(student);

    expect(transactionalEntityManager.createQueryBuilder).toHaveBeenCalled();
  });

  it('should remove child collections when update receives empty arrays', async () => {
    const student = buildStudent({
      socialBenefitNames: [],
    });

    (ormRepository.findOne as jest.Mock).mockResolvedValue(
      buildStudentOrmEntity(student),
    );

    await repository.update(student);

    expect(transactionalEntityManager.createQueryBuilder).toHaveBeenCalled();
  });

  it('should coerce database date strings when mapping students', async () => {
    const ormEntity = buildStudentOrmEntity(buildStudent());
    ormEntity.birthDate = '1990-01-01' as unknown as Date;

    queryBuilder.getMany.mockResolvedValue([ormEntity]);

    const students = await repository.findAll();

    expect(students).toHaveLength(1);
    expect(students[0].student.birthDate).toBeInstanceOf(Date);
    expect(students[0].student.birthDate?.toISOString()).toContain('1990-01-01');
  });

  it('should filter students using the query builder', async () => {
    const ormEntity = buildStudentOrmEntity(buildStudent());
    queryBuilder.getManyAndCount.mockResolvedValue([[ormEntity], 1]);

    const result = await repository.findAllWithFilter({
      search: 'student',
      modality: 'PRESENCIAL',
      city: ['Sao Paulo/SP'],
      disabilityType: ['visual'],
      page: 2,
      pageSize: 20,
    });

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(ormRepository.createQueryBuilder as jest.Mock).toHaveBeenCalledWith(
      'student',
    );
    expect(queryBuilder.innerJoinAndSelect).toHaveBeenCalledWith(
      'student.user',
      'user',
      'user.deletedAt IS NULL',
    );
    expect(queryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
      'student.telephone',
      'telephone',
    );
    expect(queryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
      'student.address',
      'address',
    );
    expect(queryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
      'student.disabilities',
      'disabilities',
    );
    expect(queryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
      'student.socialBenefits',
      'socialBenefits',
    );
    expect(queryBuilder.leftJoinAndMapMany).toHaveBeenCalled();
    expect(queryBuilder.leftJoinAndMapOne).toHaveBeenCalled();
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      'course.modality = :modality',
      { modality: 'PRESENCIAL' },
    );
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(expect.any(Brackets));
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      'disabilities.name IN (:...disabilityTypes)',
      { disabilityTypes: ['visual'] },
    );
    expect(queryBuilder.skip).toHaveBeenCalledWith(20);
    expect(queryBuilder.take).toHaveBeenCalledWith(20);
    expect(result.items).toHaveLength(1);
    expect(result.total).toBe(1);
    expect(result.items[0].email).toBe('student@test.com');
    expect(result.items[0].phoneNumber).toBe('11999999999');
  });

  it('should filter students by normalized cpf inside search', async () => {
    queryBuilder.getManyAndCount.mockResolvedValue([
      [buildStudentOrmEntity(buildStudent())],
      1,
    ]);

    await repository.findAllWithFilter({
      search: '123.456.789-09',
      page: 1,
      pageSize: 50,
    });

    expect(queryBuilder.andWhere).toHaveBeenCalled();
    expect(queryBuilder.skip).toHaveBeenCalledWith(0);
    expect(queryBuilder.take).toHaveBeenCalledWith(50);
  });

  it('should map selected students for report preserving requested order', async () => {
    queryBuilder.getRawMany.mockResolvedValue([
      buildStudentReportRawRow({
        id: 'student-1',
        fullName: 'Ana',
        courseId: 'course-1',
        courseName: 'Curso Online',
      }),
      buildStudentReportRawRow({
        id: 'student-1',
        fullName: 'Ana',
        courseId: 'course-2',
        courseName: 'Curso Presencial',
      }),
      buildStudentReportRawRow({
        id: 'student-2',
        fullName: 'Bruno',
        courseId: null,
        courseName: null,
      }),
    ]);

    const result = await repository.findManyForReportByIds([
      'student-2',
      'student-1',
    ]);

    expect(queryBuilder.innerJoin).toHaveBeenCalledWith(
      'student.user',
      'user',
      'user.deletedAt IS NULL',
    );
    expect(queryBuilder.leftJoin).toHaveBeenCalled();
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      'student.id IN (:...ids)',
      { ids: ['student-2', 'student-1'] },
    );
    expect(result).toEqual([
      expect.objectContaining({
        id: 'student-2',
        courseNames: [],
      }),
      expect.objectContaining({
        id: 'student-1',
        courseNames: ['Curso Online', 'Curso Presencial'],
      }),
    ]);
  });

  it('should apply report filters for course, location, pcd and status', async () => {
    queryBuilder.getRawMany.mockResolvedValue([]);

    await repository.findManyForReportByFilters({
      course: 'Curso',
      location: 'Sao Paulo/SP',
      pcdType: 'FISICO',
      status: 'INSCRICAO',
    });

    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      'reportCourse.name ILIKE :course',
      { course: '%Curso%' },
    );
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      'address.city ILIKE :locationCity AND address.state ILIKE :locationState',
      {
        locationCity: '%Sao Paulo%',
        locationState: 'SP',
      },
    );
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      'disabilities.id IS NOT NULL',
    );
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      'LOWER(disabilities.name) IN (:...pcdTypes)',
      { pcdTypes: ['fisica', 'fisico', 'f\u00edsica', 'f\u00edsico'] },
    );
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      expect.stringContaining('EXISTS'),
      { statusType: 'INSCRICAO' },
    );
  });

  it('should apply report filters for students without enrollments', async () => {
    queryBuilder.getRawMany.mockResolvedValue([]);

    await repository.findManyForReportByFilters({
      status: 'NAO_INSCRITO',
    });

    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      expect.stringContaining('NOT EXISTS'),
    );
  });
});

function buildStudent({
  socialBenefitNames = [],
}: {
  socialBenefitNames?: string[];
} = {}): Student {
  return new Student(
    'student-id',
    'hashedPassword',
    'student@test.com',
    '12345678909',
    new Contact(
      'student-id',
      '11999999999',
      'Centro',
      'SP',
      'Sao Paulo',
      'Rua A',
      '01001000',
      'Sala 1',
    ),
    new Date('1990-01-01'),
    Gender.MALE,
    Race.WHITE,
    'Student Name',
    undefined, // householdSize
    [], // disabilities
    socialBenefitNames,
  );
}

function buildStudentOrmEntity(
  student: Student,
  options: {
    socialBenefitIds?: number[];
  } = {},
): StudentOrmEntity {
  const user = new UserOrmEntity();
  user.id = student.id;
  user.email = student.email;
  user.password = student.password;
  user.role = UserRoleEnum.STUDENT;

  const telephone = {
    id: student.contact.id,
    phone: student.contact.phone,
  } as TelephoneStudentOrmEntity;

  const address = {
    id: student.contact.id,
    neighbourhood: student.contact.neighbourhood ?? null,
    state: student.contact.state ?? null,
    city: student.contact.city ?? null,
    address: student.contact.address ?? null,
    cep: student.contact.cep ?? null,
    complement: student.contact.complement ?? null,
  } as AddressStudentOrmEntity;

  const ormEntity = new StudentOrmEntity();
  ormEntity.id = student.id;
  ormEntity.user = user;
  ormEntity.telephone = telephone;
  ormEntity.address = address;
  ormEntity.cpf = student.cpf;
  ormEntity.birthDate = student.birthDate ?? null;
  ormEntity.gender = student.gender ?? null;
  ormEntity.race = student.race ?? null;
  ormEntity.fullName = student.fullName ?? null;
  ormEntity.education = student.education ?? null;
  ormEntity.institution = student.institution ?? null;
  ormEntity.activityArea = student.activityArea ?? null;
  ormEntity.hasProgrammingExperience = student.hasProgrammingExperience ?? null;
  ormEntity.motivation = student.motivation ?? null;
  ormEntity.howHeard = student.howHeard ?? null;
  ormEntity.hasComputer = student.hasComputer ?? null;
  ormEntity.hasInternet = student.hasInternet ?? null;
  ormEntity.committedToParticipate = student.committedToParticipate ?? null;
  ormEntity.socialBenefits = (options.socialBenefitIds ?? []).map((id) => {
    const benefit = new SocialBenefitOrmEntity();
    benefit.id = String(id);
    benefit.name = 'OUTROS';
    return benefit;
  });

  return ormEntity;
}

function buildStudentReportRawRow({
  id,
  fullName,
  courseId,
  courseName,
}: {
  id: string;
  fullName: string;
  courseId: string | null;
  courseName: string | null;
}) {
  return {
    student_id: id,
    email: `${id}@test.com`,
    cpf: '12345678900',
    full_name: fullName,
    social_name: null,
    phone_number: '11999999999',
    city: 'Sao Paulo',
    state: 'SP',
    disability_has_disability: false,
    disability_type: null,
    course_id: courseId,
    course_name: courseName,
  };
}
