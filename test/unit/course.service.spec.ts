/* eslint-disable @typescript-eslint/unbound-method */
import { CreateCourseCommand } from '../../src/core/command/course.command';
import { Course } from '../../src/core/domain/course.entity';
import { DomainException } from '../../src/core/exceptions/domain.exception';
import { CourseNotFoundException } from '../../src/core/exceptions/course-not-found.exception';
import { ICourseRepository } from '../../src/core/ports/course.repository.interface';
import { CourseService } from '../../src/core/services/course.service';

describe('CourseService', () => {
  let service: CourseService;

  const mockRepository: ICourseRepository = {
    create: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    findManyByIds: jest.fn(),
    findManyByFilters: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const createCommand: CreateCourseCommand = {
    name: 'Desenvolvimento Web Full Stack',
    banner: 'https://fatilab.com/banners/web.jpg',
    description: 'Curso completo de desenvolvimento web com React e Node.js.',
    courseLoad: '120h',
    startDate: '2025-02-01T00:00:00.000Z',
    endDate: '2025-06-30T00:00:00.000Z',
    startRegistrations: '2025-01-01T00:00:00.000Z',
    endRegistrations: '2025-01-28T00:00:00.000Z',
    modality: 'ONLINE',
    linkAccess: 'https://fatilab.com/cursos/web',
    vacancyCount: 30,
    shift: 'MANHA',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new CourseService(mockRepository);
  });

  describe('createCourse', () => {
    it('should create a course with the persisted schema shape', async () => {
      (mockRepository.create as jest.Mock).mockImplementation((course) =>
        Promise.resolve(course),
      );

      const result = await service.createCourse(createCommand);

      expect(result).toBeInstanceOf(Course);
      expect(result.name).toBe(createCommand.name);
      expect(result.banner).toBe(createCommand.banner);
      expect(result.courseLoad).toBe(createCommand.courseLoad);
      expect(result.linkAccess).toBe(createCommand.linkAccess);
      expect(mockRepository.create).toHaveBeenCalledTimes(1);
    });

    it('should create a course when optional linkAccess is omitted', async () => {
      const commandWithoutLinkAccess = { ...createCommand };
      delete commandWithoutLinkAccess.linkAccess;

      (mockRepository.create as jest.Mock).mockImplementation((course) =>
        Promise.resolve(course),
      );

      const result = await service.createCourse(commandWithoutLinkAccess);

      expect(result).toBeInstanceOf(Course);
      expect(result.linkAccess).toBeUndefined();
      expect(mockRepository.create).toHaveBeenCalledTimes(1);
    });

    it('should throw DomainException when course end date is before start date', async () => {
      await expect(
        service.createCourse({
          ...createCommand,
          startDate: '2025-06-30T00:00:00.000Z',
          endDate: '2025-02-01T00:00:00.000Z',
        }),
      ).rejects.toThrow(DomainException);

      expect(mockRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('findCourseById', () => {
    it('should return the course when it exists', async () => {
      const course = new Course(
        '123e4567-e89b-12d3-a456-426614174000',
        createCommand.name,
        createCommand.banner,
        createCommand.courseLoad,
        new Date(createCommand.startDate),
        new Date(createCommand.endDate),
        new Date(createCommand.startRegistrations),
        new Date(createCommand.endRegistrations),
        createCommand.modality,
        createCommand.linkAccess,
        createCommand.vacancyCount,
        createCommand.shift,
        createCommand.address,
        createCommand.description,
      );

      (mockRepository.findById as jest.Mock).mockResolvedValue(course);

      const result = await service.findCourseById(course.id);

      expect(result).toBe(course);
      expect(mockRepository.findById).toHaveBeenCalledWith(course.id);
    });

    it('should throw CourseNotFoundException when course does not exist', async () => {
      (mockRepository.findById as jest.Mock).mockResolvedValue(null);

      await expect(service.findCourseById('non-existent-id')).rejects.toThrow(
        CourseNotFoundException,
      );
    });
  });

  describe('getAllCourses', () => {
    it('should return all courses', async () => {
      const course = new Course(
        '123e4567-e89b-12d3-a456-426614174000',
        createCommand.name,
        createCommand.banner,
        createCommand.courseLoad,
        new Date(createCommand.startDate),
        new Date(createCommand.endDate),
        new Date(createCommand.startRegistrations),
        new Date(createCommand.endRegistrations),
        createCommand.modality,
        createCommand.linkAccess,
        createCommand.vacancyCount,
        createCommand.shift,
        createCommand.address,
        createCommand.description,
      );

      (mockRepository.findAll as jest.Mock).mockResolvedValue([course]);

      const result = await service.getAllCourses();

      expect(result).toHaveLength(1);
      expect(result[0]).toBe(course);
      expect(mockRepository.findAll).toHaveBeenCalledTimes(1);
    });
  });
});
