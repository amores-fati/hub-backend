import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  Min,
  IsBoolean,
  IsIn,
  IsArray,
  ArrayUnique,
  ValidateIf,
} from 'class-validator';

export const WORKPLACE_TYPES = ['presential', 'online', 'hybrid'] as const;

export class CreateUpdateJobOpeningDto {
  @ApiProperty({
    example: 'Desenvolvedor Frontend',
    description: 'Título da vaga',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

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
  })
  @IsString()
  @IsNotEmpty()
  link: string;

  @ApiProperty({ example: 3, description: 'Quantidade de vagas' })
  @IsInt()
  @Min(1)
  vacancyCount: number;

  @ApiProperty({ example: false, description: 'Indicador PCD' })
  @IsBoolean()
  isPcd: boolean;

  @ApiProperty({
    example: 'presential',
    enum: WORKPLACE_TYPES,
    description: 'Tipo de local de trabalho',
  })
  @IsString()
  @IsIn(WORKPLACE_TYPES as unknown as string[])
  workplaceType: string;

  @ApiProperty({ example: ['react', 'typescript'], required: false })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @ValidateIf((o: CreateUpdateJobOpeningDto) => o.skills !== undefined)
  @IsString({ each: true })
  skills?: string[];
}
