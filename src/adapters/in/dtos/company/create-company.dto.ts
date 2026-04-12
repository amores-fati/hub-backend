import {
  IsString,
  IsNotEmpty,
  IsEmail,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IsCnpj } from '../../../../utils/validators/cnpj.validator';
import { Type } from 'class-transformer';
import { CreateContactDto } from '../contact/create-contact.dto';

export class CreateCompanyDto {
  @ApiProperty({
    example: 'contato@techcorp.com',
    description: 'E-mail corporativo',
  })
  @IsEmail()
  @IsNotEmpty()
  @MaxLength(100)
  email: string;

  @ApiProperty({
    example: 'SenhaForte123!',
    description: 'Senha de acesso à plataforma',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  password: string;

  @ApiProperty({
    example: 'Tech Corp Ltda',
    description: 'Razão social ou nome fantasia da empresa',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiProperty({
    example: '60680743000181',
    description: 'CNPJ da empresa',
  })
  @IsCnpj()
  @IsNotEmpty()
  @MaxLength(18)
  cnpj: string;

  @ApiProperty({ example: 'João da Silva', description: 'Nome do responsável' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  ownerName: string;

  @ApiProperty({ type: () => CreateContactDto })
  @ValidateNested()
  @Type(() => CreateContactDto)
  contact: CreateContactDto;
}
