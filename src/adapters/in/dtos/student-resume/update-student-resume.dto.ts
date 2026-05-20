import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, ValidateIf } from 'class-validator';

import { UpsertStudentResumeCommand } from '../../../../core/command/student-resume.command';

export class UpdateStudentResumeDto implements UpsertStudentResumeCommand {
  @ApiPropertyOptional({
    example: 'Desenvolvedor em formacao com interesse em tecnologia.',
    nullable: true,
  })
  @ValidateIf((_, value) => value !== undefined && value !== null)
  @IsString()
  about?: string | null;

  @ApiPropertyOptional({
    example: 'https://www.linkedin.com/in/aluno',
    nullable: true,
  })
  @ValidateIf((_, value) => value !== undefined && value !== null)
  @IsString()
  linkedinUrl?: string | null;

  @ApiPropertyOptional({
    example: 'https://github.com/aluno',
    nullable: true,
  })
  @ValidateIf((_, value) => value !== undefined && value !== null)
  @IsString()
  githubUrl?: string | null;

  @ApiPropertyOptional({
    example: 'Backend',
    nullable: true,
  })
  @ValidateIf((_, value) => value !== undefined && value !== null)
  @IsString()
  preference?: string | null;
}
