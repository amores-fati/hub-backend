import { PartialType } from '@nestjs/swagger';
import { UpdateStudentDto } from './update-student.dto';

export class PatchStudentDto extends PartialType(UpdateStudentDto) {}
