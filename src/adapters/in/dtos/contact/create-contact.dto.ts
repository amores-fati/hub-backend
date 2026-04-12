import {
  IsString,
  IsNotEmpty,
  IsOptional,
  MaxLength,
  Length,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsCep } from 'src/utils/validators/cep.validator';

export class CreateContactDto {
  @ApiProperty({ example: '5511999999999', description: 'Telefone de contato' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  phone: string;

  @ApiPropertyOptional({ example: 'Centro' })
  @IsString()
  @IsOptional()
  neighbourhood?: string;

  @ApiPropertyOptional({ example: 'SP', description: 'Sigla do Estado (UF)' })
  @IsString()
  @IsOptional()
  @Length(2, 2)
  state?: string;

  @ApiPropertyOptional({ example: 'São Paulo' })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiPropertyOptional({ example: 'Av. Paulista, 1000' })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({ example: '89900000' })
  @IsCep()
  @IsOptional()
  @MaxLength(9)
  cep?: string;

  @ApiPropertyOptional({ example: 'Sala 42' })
  @IsString()
  @IsOptional()
  complement?: string;
}
