import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IStudentRepository } from '../../../core/ports/student.repository.interface';
import { Student } from '../../../core/domain/student.entity';
import { StudentOrmEntity } from './student.orm-entity';

@Injectable()
export class StudentRepository implements IStudentRepository {
  constructor(
    @InjectRepository(StudentOrmEntity)
    private readonly ormRepository: Repository<StudentOrmEntity>,
  ) {}

  async create(student: Student): Promise<Student> {
    const ormEntity = this.ormRepository.create(student);
    const savedEntity = await this.ormRepository.save(ormEntity);
    return this.mapToDomain(savedEntity);
  }

  async findAll(): Promise<Student[]> {
    const ormEntities = await this.ormRepository.find();
    return ormEntities.map((e) => this.mapToDomain(e));
  }

  async findById(id: string): Promise<Student | null> {
    const ormEntity = await this.ormRepository.findOne({ where: { id } });
    return ormEntity ? this.mapToDomain(ormEntity) : null;
  }

  async findByCpf(cpf: string): Promise<Student | null> {
    const ormEntity = await this.ormRepository.findOne({ where: { cpf } });
    return ormEntity ? this.mapToDomain(ormEntity) : null;
  }

  private mapToDomain(ormEntity: StudentOrmEntity): Student {
    return new Student(
      ormEntity.id,
      ormEntity.name,
      ormEntity.socialName,
      ormEntity.cpf,
      ormEntity.birthDate,
      ormEntity.phone,
      ormEntity.email,
      ormEntity.password,
      ormEntity.gender,
      ormEntity.race,
      ormEntity.cep,
      ormEntity.address,
      ormEntity.complement,
      ormEntity.neighborhood,
      ormEntity.city,
      ormEntity.state,
      ormEntity.education,
      ormEntity.courseName,
      ormEntity.institution,
      ormEntity.fatilabMotivation,
      ormEntity.howHeard,
      ormEntity.hasComputer,
      ormEntity.hasInternet,
      ormEntity.committedToParticipate,
      ormEntity.familyIncome,
      ormEntity.householdSize,
      ormEntity.socialBenefits,
      ormEntity.hasProgrammingExperience,
      ormEntity.hasTechCourses,
      ormEntity.techCoursesList,
      ormEntity.isEmployed,
      ormEntity.workArea,
      ormEntity.isPcd,
      ormEntity.disabilityType,
      ormEntity.disabilityDescription,
      ormEntity.hasMedicalReport,
      ormEntity.accessibilityResources,
      ormEntity.specificAccessibilityNeeds,
      ormEntity.authorizesImageUse,
      ormEntity.acceptsLgpd,
      ormEntity.sendCurriculum,
      ormEntity.createdAt,
      ormEntity.updatedAt,
    );
  }
}