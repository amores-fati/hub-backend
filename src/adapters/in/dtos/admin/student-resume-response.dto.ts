import { ApiProperty } from '@nestjs/swagger';

export class SkillResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  skillName: string;
}

export class StudentBasicResponseDto {
  @ApiProperty()
  fullName: string;

  @ApiProperty()
  email: string;
}

export class StudentResumeResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ nullable: true })
  about: string | null;

  @ApiProperty()
  linkedinUrl: string;

  @ApiProperty()
  githubUrl: string;

  @ApiProperty({ nullable: true })
  photoUrl: string | null;

  @ApiProperty({ type: [SkillResponseDto] })
  skills: SkillResponseDto[];

  @ApiProperty()
  student: StudentBasicResponseDto;
}
