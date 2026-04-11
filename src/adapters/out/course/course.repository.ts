import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Course } from '../../../core/domain/course.entity';
import { CourseOrmEntity } from './course.orm-entity';

@Injectable()
export class CourseRepository implements CourseRepository {
  constructor(
    @InjectRepository(CourseOrmEntity)
    private readonly ormRepository: Repository<CourseOrmEntity>,
  ) {}

  async create(course: Course): Promise<Course> {
    const ormEntity = this.ormRepository.create(course);
    const savedEntity = await this.ormRepository.save(ormEntity);
    return this.mapToDomain(savedEntity);
  }

  async findAll(): Promise<Course[]> {
    const ormEntities = await this.ormRepository.find();
    return ormEntities.map((e) => this.mapToDomain(e));
  }

  private mapToDomain(ormEntity: CourseOrmEntity): Course {
    return new Course(
      ormEntity.id,
      ormEntity.title,
      ormEntity.description,
      ormEntity.createdAt,
      ormEntity.updatedAt,
    );
  }
}
