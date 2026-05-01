// src/adapters/in/dtos/student/delete-students.dto.ts
import { IsUUID, ArrayNotEmpty, IsArray } from 'class-validator';

export class DeleteStudentsDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  ids!: string[];
}