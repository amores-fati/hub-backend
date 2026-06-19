import {
  IsEmail,
  IsOptional,
  IsString,
  Length,
  MaxLength,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateCompanyMeDto {
  @ApiPropertyOptional({ example: 'contato@empresa.com.br' })
  @IsEmail()
  @IsOptional()
  @MaxLength(100)
  email?: string;

  @ApiPropertyOptional({ example: '5511999999999' })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  phone?: string;

  @ApiPropertyOptional({ example: 'São Paulo' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  city?: string;

  @ApiPropertyOptional({ example: 'SP', description: 'Sigla do Estado (UF)' })
  @IsString()
  @IsOptional()
  @Length(2, 2)
  state?: string;

  @ApiPropertyOptional({ example: 'Bela Vista' })
  @IsString()
  @IsOptional()
  neighbourhood?: string;

  @ApiPropertyOptional({ example: 'Av. Ipiranga, 201' })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  address?: string;

  @ApiPropertyOptional({ example: 'Sala 42' })
  @IsString()
  @IsOptional()
  complement?: string;

  @ApiPropertyOptional({ example: '89900000' })
  @IsString()
  @IsOptional()
  @MaxLength(9)
  cep?: string;
}
