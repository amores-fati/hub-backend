import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCourseDto {
  @ApiProperty({ example: 'NestJS Avançado', description: 'Título do curso' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    example: 'Arquitetura Hexagonal na prática',
    description: 'Descrição detalhada',
  })
  @IsString()
  @IsNotEmpty()
  description: string;
}
