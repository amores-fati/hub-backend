import { Repository } from 'typeorm';

import { CourseRepository } from '../../src/adapters/out/repository/course.repository';
import { CourseOrmEntity } from '../../src/adapters/out/orm/course.orm-entity';

describe('CourseRepository', () => {
  let ormRepository: Repository<CourseOrmEntity>;
  let repository: CourseRepository;

  beforeEach(() => {
    ormRepository = {
      find: jest.fn(),
    } as unknown as Repository<CourseOrmEntity>;

    repository = new CourseRepository(ormRepository);
  });

  it('should coerce database date strings when listing courses', async () => {
    const ormEntity = new CourseOrmEntity();
    ormEntity.id = 'course-id';
    ormEntity.name = 'Curso Teste';
    ormEntity.banner = 'https://fatilab.com/banner.png';
    ormEntity.description = 'Descricao';
    ormEntity.courseLoad = '120h';
    ormEntity.startDate = '2025-02-01' as unknown as Date;
    ormEntity.endDate = '2025-06-30' as unknown as Date;
    ormEntity.startRegistrations = '2025-01-01' as unknown as Date;
    ormEntity.endRegistrations = '2025-01-28' as unknown as Date;
    ormEntity.modality = 'ONLINE';
    ormEntity.linkAccess = 'https://fatilab.com/cursos/teste';
    ormEntity.vacancyCount = 30;

    (ormRepository.find as jest.Mock).mockResolvedValue([ormEntity]);

    const courses = await repository.findAll();

    expect(courses).toHaveLength(1);
    expect(courses[0].startDate).toBeInstanceOf(Date);
    expect(courses[0].endDate).toBeInstanceOf(Date);
    expect(courses[0].startRegistrations).toBeInstanceOf(Date);
    expect(courses[0].endRegistrations).toBeInstanceOf(Date);
    expect(courses[0].vacancyCount).toBe(30);
  });

  it('should attach in-person addresses as location when listing with location', async () => {
    const ormEntity = new CourseOrmEntity();
    ormEntity.id = 'course-id';
    ormEntity.name = 'Curso Presencial';
    ormEntity.banner = 'https://fatilab.com/banner.png';
    ormEntity.description = null;
    ormEntity.courseLoad = '60h';
    ormEntity.startDate = '2025-02-01' as unknown as Date;
    ormEntity.endDate = '2025-06-30' as unknown as Date;
    ormEntity.startRegistrations = '2025-01-01' as unknown as Date;
    ormEntity.endRegistrations = '2025-01-28' as unknown as Date;
    ormEntity.modality = 'PRESENCIAL';
    ormEntity.linkAccess = 'https://fatilab.com/cursos/teste';
    ormEntity.vacancyCount = 20;
    ormEntity.address = 'Porto Alegre - RS';

    (ormRepository.find as jest.Mock).mockResolvedValue([ormEntity]);

    const result = await repository.findAllWithLocation();

    expect(result).toHaveLength(1);
    expect(result[0].course.id).toBe('course-id');
    expect(result[0].location).toBe('Porto Alegre - RS');
  });
});
