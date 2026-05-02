import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConsumes,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { EmptyResumeSkillNameException } from '../../../core/exceptions/empty-resume-skill-name.exception';
import { InvalidResumePhotoException } from '../../../core/exceptions/invalid-resume-photo.exception';
import { InvalidResumeUrlException } from '../../../core/exceptions/invalid-resume-url.exception';
import { ResumeSkillAlreadyExistsException } from '../../../core/exceptions/resume-skill-already-exists.exception';
import { ResumeSkillNotFoundException } from '../../../core/exceptions/resume-skill-not-found.exception';
import { ResumeNotFoundException } from '../../../core/exceptions/resume-not-found.exception';
import { StudentNotFoundException } from '../../../core/exceptions/student-not-found.exception';
import { StudentResumeService } from '../../../core/services/student-resume.service';
import { CurrentUser } from '../../../utils/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../../utils/decorators/current-user.decorator';
import { RequireAuth } from '../../../utils/decorators/api-auth.decorator';
import { AmoresFatiLogger } from '../../../utils/logger';
import { CreateStudentResumeSkillDto } from '../dtos/student-resume/create-student-resume-skill.dto';
import { UpdateStudentResumeDto } from '../dtos/student-resume/update-student-resume.dto';

interface UploadedResumePhotoFile {
  originalname?: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

@ApiTags('Student Resume')
@Controller()
export class StudentResumeController {
  constructor(
    private readonly studentResumeService: StudentResumeService,
    private readonly logger: AmoresFatiLogger,
  ) {
    this.logger.setContext(StudentResumeController.name);
  }

  @RequireAuth()
  @Get(['students/me/resume', 'users/student/resume'])
  @ApiOperation({ summary: 'Consulta o curriculo do aluno autenticado' })
  @ApiOkResponse({
    description: 'Curriculo encontrado com sucesso.',
    schema: {
      example: {
        id: '1d8f37f5-91a9-4c44-b75c-7a4f7576ad21',
        about: 'Desenvolvedor em formacao.',
        linkedinUrl: 'https://www.linkedin.com/in/aluno',
        githubUrl: 'https://github.com/aluno',
        photoUrl: '/uploads/resume-photos/student-id/photo.webp',
        skills: [{ id: 'skill-id', skillName: 'TypeScript' }],
      },
    },
  })
  @ApiNotFoundResponse({ description: 'Curriculo nao encontrado.' })
  async getResume(@CurrentUser() user: AuthenticatedUser) {
    try {
      this.logger.info('Fetching authenticated student resume', {
        userId: user.id,
      });
      const curriculum = await this.studentResumeService.getResume(user.id);
      return curriculum.toJSON();
    } catch (error) {
      if (error instanceof ResumeNotFoundException) {
        this.logger.warn('Authenticated student resume not found', {
          userId: user.id,
        });
        throw this.notFound(error.message);
      }

      throw error;
    }
  }

  @RequireAuth()
  @Put(['students/me/resume', 'users/student/resume'])
  @ApiOperation({
    summary: 'Cria ou atualiza o curriculo do aluno autenticado',
  })
  @ApiBody({ type: UpdateStudentResumeDto })
  @ApiOkResponse({ description: 'Curriculo atualizado com sucesso.' })
  @ApiBadRequestResponse({ description: 'Erro de validacao.' })
  async upsertResume(
    @CurrentUser() user: AuthenticatedUser,
    @Body() updateStudentResumeDto: UpdateStudentResumeDto,
  ) {
    try {
      this.logger.info('Upserting authenticated student resume', {
        userId: user.id,
      });
      const curriculum = await this.studentResumeService.upsertResume(
        user.id,
        updateStudentResumeDto,
      );
      return curriculum.toJSON();
    } catch (error) {
      if (error instanceof InvalidResumeUrlException) {
        this.logger.warn('Invalid student resume URL', { userId: user.id });
        throw this.validationError(error.message);
      }

      if (error instanceof StudentNotFoundException) {
        this.logger.warn('Student not found for resume upsert', {
          userId: user.id,
        });
        throw this.notFound(error.message);
      }

      throw error;
    }
  }

  @RequireAuth()
  @Post(['students/me/resume/photo', 'users/student/resume/photo'])
  @UseInterceptors(FileInterceptor('photo'))
  @ApiOperation({
    summary: 'Atualiza a foto do curriculo do aluno autenticado',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        photo: {
          type: 'string',
          format: 'binary',
        },
      },
      required: ['photo'],
    },
  })
  @ApiOkResponse({
    description: 'Foto atualizada com sucesso.',
    schema: { example: { photoUrl: '/uploads/resume-photos/id/photo.webp' } },
  })
  @ApiBadRequestResponse({ description: 'Arquivo invalido.' })
  async uploadPhoto(
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFile() photo?: UploadedResumePhotoFile,
  ) {
    try {
      this.logger.info('Uploading authenticated student resume photo', {
        userId: user.id,
      });
      return await this.studentResumeService.uploadPhoto(
        user.id,
        photo
          ? {
              originalName: photo.originalname,
              mimeType: photo.mimetype,
              size: photo.size,
              buffer: photo.buffer,
            }
          : undefined,
      );
    } catch (error) {
      if (error instanceof InvalidResumePhotoException) {
        this.logger.warn('Invalid student resume photo', { userId: user.id });
        throw new BadRequestException({
          statusCode: 400,
          message: error.message,
          error: 'Bad Request',
          errorKind: 'INVALID_FILE',
        });
      }

      if (error instanceof StudentNotFoundException) {
        this.logger.warn('Student not found for resume photo upload', {
          userId: user.id,
        });
        throw this.notFound(error.message);
      }

      throw error;
    }
  }

  @RequireAuth()
  @Post(['users/student/resume/skills', 'students/me/resume/skills'])
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Adiciona uma habilidade ao curriculo do aluno autenticado',
  })
  @ApiBody({ type: CreateStudentResumeSkillDto })
  @ApiCreatedResponse({
    description: 'Habilidade adicionada com sucesso.',
    schema: { example: { id: 'skill-id', skillName: 'TypeScript' } },
  })
  @ApiBadRequestResponse({ description: 'Erro de validacao.' })
  @ApiConflictResponse({ description: 'Habilidade ja cadastrada.' })
  async addSkill(
    @CurrentUser() user: AuthenticatedUser,
    @Body() createStudentResumeSkillDto: CreateStudentResumeSkillDto,
  ) {
    try {
      this.logger.info('Adding authenticated student resume skill', {
        userId: user.id,
      });
      return await this.studentResumeService.addSkill(
        user.id,
        createStudentResumeSkillDto,
      );
    } catch (error) {
      if (error instanceof EmptyResumeSkillNameException) {
        this.logger.warn('Invalid student resume skill name', {
          userId: user.id,
        });
        throw this.validationError(error.message);
      }

      if (error instanceof ResumeSkillAlreadyExistsException) {
        this.logger.warn('Duplicated student resume skill', {
          userId: user.id,
        });
        throw this.conflict(error.message);
      }

      if (error instanceof StudentNotFoundException) {
        this.logger.warn('Student not found for resume skill creation', {
          userId: user.id,
        });
        throw this.notFound(error.message);
      }

      throw error;
    }
  }

  @RequireAuth()
  @Delete([
    'students/me/resume/skills/:skillId',
    'users/student/resume/skills/:skillId',
  ])
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Remove uma habilidade do curriculo do aluno autenticado',
  })
  @ApiNoContentResponse({ description: 'Habilidade removida com sucesso.' })
  @ApiNotFoundResponse({ description: 'Habilidade nao encontrada.' })
  async removeSkill(
    @CurrentUser() user: AuthenticatedUser,
    @Param('skillId', ParseUUIDPipe) skillId: string,
  ): Promise<void> {
    try {
      this.logger.info('Removing authenticated student resume skill', {
        userId: user.id,
        skillId,
      });
      await this.studentResumeService.removeSkill(user.id, skillId);
    } catch (error) {
      if (error instanceof ResumeSkillNotFoundException) {
        this.logger.warn('Student resume skill not found', {
          userId: user.id,
          skillId,
        });
        throw this.notFound(error.message);
      }

      throw error;
    }
  }

  private notFound(message: string): NotFoundException {
    return new NotFoundException({
      statusCode: 404,
      message,
      error: 'Not Found',
      errorKind: 'NOT_FOUND',
    });
  }

  private validationError(message: string): BadRequestException {
    return new BadRequestException({
      statusCode: 400,
      message,
      error: 'Bad Request',
      errorKind: 'VALIDATION_ERROR',
    });
  }

  private conflict(message: string): ConflictException {
    return new ConflictException({
      statusCode: 409,
      message,
      error: 'Conflict',
      errorKind: 'CONFLICT',
    });
  }
}
