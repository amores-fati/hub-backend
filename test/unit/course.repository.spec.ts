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
    ormEntity.linkAccess = 'https://fatilab.com/cursos/teste';

    (ormRepository.find as jest.Mock).mockResolvedValue([ormEntity]);

    const courses = await repository.findAll();

    expect(courses).toHaveLength(1);
    expect(courses[0].startDate).toBeInstanceOf(Date);
    expect(courses[0].endDate).toBeInstanceOf(Date);
    expect(courses[0].startRegistrations).toBeInstanceOf(Date);
    expect(courses[0].endRegistrations).toBeInstanceOf(Date);
  });
});
