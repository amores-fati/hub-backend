import { Brackets, Repository } from 'typeorm';

import { Contact } from '../../src/core/domain/contact.entity';
import { Gender, Race } from '../../src/core/domain/enums/student-profile.enum';
import { SocialBenefitType } from '../../src/core/domain/enums/social-benefit.enum';
import { SocialBenefit } from '../../src/core/domain/social-benefit.entity';
import { Student } from '../../src/core/domain/student.entity';
import { StudentRepository } from '../../src/adapters/out/repository/student.repository';
import { ContactOrmEntity } from '../../src/adapters/out/orm/contact.orm-entity';
import { SocialBenefitOrmEntity } from '../../src/adapters/out/orm/social-benefit.orm-entity';
import { StudentOrmEntity } from '../../src/adapters/out/orm/student.orm-entity';
import { UserOrmEntity } from '../../src/adapters/out/orm/user.orm-entity';
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
  };
  let queryBuilder: {
    andWhere: jest.Mock;
    getManyAndCount: jest.Mock;
    innerJoinAndSelect: jest.Mock;
    leftJoinAndMapMany: jest.Mock;
    leftJoinAndMapOne: jest.Mock;
    leftJoinAndSelect: jest.Mock;
    skip: jest.Mock;
    take: jest.Mock;
  };
  let ormRepository: Repository<StudentOrmEntity>;
  let repository: StudentRepository;

  beforeEach(() => {
    transactionalEntityManager = {
      delete: jest.fn().mockResolvedValue(undefined),
      save: jest.fn().mockResolvedValue(undefined),
      update: jest.fn().mockResolvedValue(undefined),
    };

    queryBuilder = {
      andWhere: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn(),
      innerJoinAndSelect: jest.fn().mockReturnThis(),
      leftJoinAndMapMany: jest.fn().mockReturnThis(),
      leftJoinAndMapOne: jest.fn().mockReturnThis(),
      leftJoinAndSelect: jest.fn().mockReturnThis(),
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
      socialBenefits: [
        new SocialBenefit(-1, 'student-id', SocialBenefitType.OTHERS),
      ],
    });

    (ormRepository.findOne as jest.Mock).mockResolvedValue(
      buildStudentOrmEntity(student, {
        socialBenefitIds: [21],
      }),
    );

    await repository.update(student);

    expect(transactionalEntityManager.delete).toHaveBeenCalledWith(
      SocialBenefitOrmEntity,
      { studentId: student.id },
    );
    expect(transactionalEntityManager.delete).toHaveBeenCalledWith(
      SocialBenefitOrmEntity,
      { studentId: student.id },
    );
  });

  it('should remove child collections when update receives empty arrays', async () => {
    const student = buildStudent({
      socialBenefits: [],
    });

    (ormRepository.findOne as jest.Mock).mockResolvedValue(
      buildStudentOrmEntity(student),
    );

    await repository.update(student);

    expect(transactionalEntityManager.delete).toHaveBeenCalledWith(
      SocialBenefitOrmEntity,
      { studentId: student.id },
    );
    expect(transactionalEntityManager.delete).toHaveBeenCalledWith(
      SocialBenefitOrmEntity,
      { studentId: student.id },
    );
  });

  it('should coerce database date strings when mapping students', async () => {
    const ormEntity = buildStudentOrmEntity(buildStudent());
    ormEntity.birthDate = '1990-01-01' as unknown as Date;

    (ormRepository.find as jest.Mock).mockResolvedValue([ormEntity]);

    const students = await repository.findAll();

    expect(students).toHaveLength(1);
    expect(students[0].birthDate).toBeInstanceOf(Date);
    expect(students[0].birthDate?.toISOString()).toContain('1990-01-01');
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
      'student.contact',
      'contact',
    );
    expect(queryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
      'student.disability',
      'disability',
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
      'disability.type IN (:...disabilityTypes)',
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
});

function buildStudent({
  socialBenefits = [],
}: {
  socialBenefits?: SocialBenefit[];
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
    undefined, // education
    undefined, // institution
    undefined, // activityArea
    undefined, // hasProgrammingExperience
    undefined, // motivation
    undefined, // howHeard
    undefined, // hasComputer
    undefined, // hasInternet
    undefined, // committedToParticipate
    undefined, // disability
    socialBenefits,
    undefined, // socialName
    undefined, // courseName
    undefined, // familyIncome
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

  const contact = new ContactOrmEntity();
  contact.id = student.contact.id;
  contact.phone = student.contact.phone;
  contact.neighbourhood = student.contact.neighbourhood ?? null;
  contact.state = student.contact.state ?? null;
  contact.city = student.contact.city ?? null;
  contact.address = student.contact.address ?? null;
  contact.cep = student.contact.cep ?? null;
  contact.complement = student.contact.complement ?? null;

  const ormEntity = new StudentOrmEntity();
  ormEntity.id = student.id;
  ormEntity.user = user;
  ormEntity.contact = contact;
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
  ormEntity.disability = null;
  ormEntity.socialBenefits = (options.socialBenefitIds ?? []).map((id) => {
    const benefit = new SocialBenefitOrmEntity();
    benefit.id = id;
    benefit.studentId = student.id;
    benefit.benefit = SocialBenefitType.OTHERS;
    return benefit;
  });

  return ormEntity;
}
