import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IEnrollmentRepository } from '../../../core/ports/enrollment.repository.interface';
import { Enrollment, EnrollmentType } from '../../../core/domain/enrollment.entity';
import { EnrollmentOrmEntity } from '../orm/enrollment.orm-entity';

@Injectable()
export class EnrollmentRepository implements IEnrollmentRepository {
  constructor(
    @InjectRepository(EnrollmentOrmEntity)
    private readonly ormRepository: Repository<EnrollmentOrmEntity>,
  ) {}

  async findByStudentId(studentId: string): Promise<Enrollment[]> {
    const ormEntities = await this.ormRepository.find({
      where: { studentId },
      order: { createdAt: 'DESC' },
    });
    return ormEntities.map((e) => this.mapToDomain(e));
  }

  async findByStudentAndCourse(studentId: string, courseId: string): Promise<Enrollment | null> {
    const ormEntity = await this.ormRepository.findOne({
      where: { studentId, courseId },
    });
    if (!ormEntity) return null;
    return this.mapToDomain(ormEntity);
  }

  async create(enrollment: Enrollment): Promise<Enrollment> {
    const ormEntity = this.ormRepository.create({
      id: enrollment.id,
      studentId: enrollment.studentId,
      courseId: enrollment.courseId,
      type: enrollment.type,
      createdAt: enrollment.createdAt,
    });
    const saved = await this.ormRepository.save(ormEntity);
    return this.mapToDomain(saved);
  }

  private mapToDomain(orm: EnrollmentOrmEntity): Enrollment {
    return new Enrollment(
      orm.id,
      orm.studentId,
      orm.courseId,
      orm.type as EnrollmentType,
      orm.createdAt,
    );
  }
}
