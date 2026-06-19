import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  Min,
  IsBoolean,
  IsEnum,
  IsArray,
  ArrayUnique,
  IsUrl,
} from 'class-validator';
import { WorkplaceTypeEnum } from '../../../../core/domain/enums/workplace-type.enum';

export class CreateUpdateJobOpeningDto {
  @ApiProperty({
    example: 'Desenvolvedor Frontend',
    description: 'Título da vaga',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: 'Vaga para trabalhar com React...',
    description: 'Descrição da vaga',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    example: 'https://company.jobs/apply/123',
    description: 'Link de candidatura',
    required: false,
  })
  @IsOptional()
  @IsUrl()
  @Transform(({ value }: { value: unknown }) =>
    value == null || value === '' ? undefined : value,
  )
  applicationLink?: string;

  @ApiProperty({ example: 3, description: 'Quantidade de vagas' })
  @IsInt()
  @Min(1)
  openingsCount: number;

  @ApiProperty({ example: false, description: 'Indicador PCD' })
  @IsBoolean()
  isPcd: boolean;

  @ApiProperty({
    example: 'presencial',
    enum: WorkplaceTypeEnum,
    description: 'Tipo de local de trabalho',
  })
  @IsEnum(WorkplaceTypeEnum)
  workplaceType: WorkplaceTypeEnum;

  @ApiProperty({ example: ['react', 'typescript'], required: false })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  skills?: string[];
}
