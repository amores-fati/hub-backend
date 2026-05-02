import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

import { AddStudentResumeSkillCommand } from '../../../../core/command/student-resume.command';

const trimStringValue = (value: unknown): unknown =>
  typeof value === 'string' ? value.trim() : value;

export class CreateStudentResumeSkillDto implements AddStudentResumeSkillCommand {
  @ApiProperty({
    example: 'TypeScript',
    description: 'Nome da habilidade a ser vinculada ao curriculo.',
  })
  @Transform(({ value }) => trimStringValue(value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  skillName: string;
}
