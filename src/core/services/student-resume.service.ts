import { randomUUID } from 'crypto';

import {
  AddStudentResumeSkillCommand,
  UploadStudentResumePhotoCommand,
  UpsertStudentResumeCommand,
} from '../command/student-resume.command';
import { Curriculum, CurriculumSkill } from '../domain/curriculum.entity';
import { EmptyResumeSkillNameException } from '../exceptions/empty-resume-skill-name.exception';
import { InvalidResumePhotoException } from '../exceptions/invalid-resume-photo.exception';
import { InvalidResumeUrlException } from '../exceptions/invalid-resume-url.exception';
import { ResumeSkillAlreadyExistsException } from '../exceptions/resume-skill-already-exists.exception';
import { ResumeSkillNotFoundException } from '../exceptions/resume-skill-not-found.exception';
import { ResumeNotFoundException } from '../exceptions/resume-not-found.exception';
import { StudentNotFoundException } from '../exceptions/student-not-found.exception';
import { ICurriculumRepository } from '../ports/curriculum.repository.interface';
import { IResumePhotoStorage } from '../ports/resume-photo-storage.interface';
import { IStudentRepository } from '../ports/student.repository.interface';

const ACCEPTED_PHOTO_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
]);

export const MAX_RESUME_PHOTO_SIZE_BYTES = 5 * 1024 * 1024;

export class StudentResumeService {
  constructor(
    private readonly curriculumRepository: ICurriculumRepository,
    private readonly studentRepository: IStudentRepository,
    private readonly resumePhotoStorage: IResumePhotoStorage,
  ) {}

  async getResume(studentId: string): Promise<Curriculum> {
    const curriculum = await this.curriculumRepository.findByStudentId(
      studentId,
    );

    if (!curriculum) {
      throw new ResumeNotFoundException(studentId);
    }

    return curriculum;
  }

  async upsertResume(
    studentId: string,
    command: UpsertStudentResumeCommand,
  ): Promise<Curriculum> {
    this.validateUrls(command);
    const curriculum = await this.findOrCreateResume(studentId);

    curriculum.updateProfile(command);

    return this.curriculumRepository.save(curriculum);
  }

  async uploadPhoto(
    studentId: string,
    command?: UploadStudentResumePhotoCommand,
  ): Promise<{ photoUrl: string }> {
    this.validatePhoto(command);
    const curriculum = await this.findOrCreateResume(studentId);
    const photoUrl = await this.resumePhotoStorage.save({
      studentId,
      originalName: command.originalName,
      mimeType: command.mimeType,
      buffer: command.buffer,
    });

    curriculum.changePhotoUrl(photoUrl);
    await this.curriculumRepository.save(curriculum);

    return { photoUrl };
  }

  async addSkill(
    studentId: string,
    command?: AddStudentResumeSkillCommand,
  ): Promise<CurriculumSkill> {
    const skillName = this.normalizeSkillName(command?.skillName);
    const curriculum = await this.findOrCreateResume(studentId);

    if (curriculum.hasSkillName(skillName)) {
      throw new ResumeSkillAlreadyExistsException(skillName);
    }

    const savedCurriculum = await this.curriculumRepository.save(curriculum);
    const skill =
      await this.curriculumRepository.findOrCreateSkillByName(skillName);

    await this.curriculumRepository.addSkillToCurriculum(
      savedCurriculum.id,
      skill.id,
    );

    savedCurriculum.addSkill(skill);

    return skill;
  }

  async removeSkill(studentId: string, skillId: string): Promise<void> {
    const curriculum = await this.curriculumRepository.findByStudentId(
      studentId,
    );

    if (!curriculum || !curriculum.hasSkill(skillId)) {
      throw new ResumeSkillNotFoundException(skillId);
    }

    await this.curriculumRepository.removeSkillFromCurriculum(
      curriculum.id,
      skillId,
    );
    curriculum.removeSkill(skillId);
  }

  private async findOrCreateResume(studentId: string): Promise<Curriculum> {
    const existing = await this.curriculumRepository.findByStudentId(studentId);

    if (existing) {
      return existing;
    }

    const studentExists = await this.studentRepository.existsById(studentId);

    if (!studentExists) {
      throw new StudentNotFoundException(studentId);
    }

    return new Curriculum(randomUUID(), studentId);
  }

  private validateUrls(command: UpsertStudentResumeCommand): void {
    this.validateUrl('linkedinUrl', command.linkedinUrl);
    this.validateUrl('githubUrl', command.githubUrl);
  }

  private normalizeSkillName(skillName?: string): string {
    if (!skillName || skillName.trim().length === 0) {
      throw new EmptyResumeSkillNameException();
    }

    return skillName.trim();
  }

  private validateUrl(field: string, value?: string | null): void {
    if (value === undefined || value === null) {
      return;
    }

    try {
      const parsedUrl = new URL(value);
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        throw new Error('Unsupported protocol');
      }
    } catch {
      throw new InvalidResumeUrlException(field);
    }
  }

  private validatePhoto(
    command?: UploadStudentResumePhotoCommand,
  ): asserts command is UploadStudentResumePhotoCommand {
    if (!command) {
      throw new InvalidResumePhotoException();
    }

    if (!ACCEPTED_PHOTO_MIME_TYPES.has(command.mimeType)) {
      throw new InvalidResumePhotoException();
    }

    if (command.size > MAX_RESUME_PHOTO_SIZE_BYTES) {
      throw new InvalidResumePhotoException();
    }
  }
}
