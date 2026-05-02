// src/adapters/in/dtos/student/delete-students.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, ArrayNotEmpty, IsArray } from 'class-validator';

export class DeleteStudentsDto {
  @ApiProperty({
    description: 'Array de UUIDs dos alunos a serem deletados',
    example: [
      '123e4567-e89b-12d3-a456-426614174000',
      '987fcdeb-51a2-43d7-90e2-123456789012',
    ],
    type: [String],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  ids!: string[];
}
