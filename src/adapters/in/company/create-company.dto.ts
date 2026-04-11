import { IsString, IsNotEmpty, IsNumber, IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IsCnpj } from '../../../utils/validators/cnpj.validator';
import { IsCep } from '../../../utils/validators/cep.validator';

export class CreateCompanyDto {
  @ApiProperty({
    example: 'Tech Corp LTDA',
    description: 'Razão social da empresa',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: '60680743000181',
    description: 'CNPJ da empresa (somente números)',
  })
  @IsCnpj()
  @IsString()
  @IsNotEmpty()
  cnpj: string;

  @ApiProperty({
    example: 'contato@techcorp.com',
    description: 'E-mail corporativo',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'São Paulo', description: 'Cidade sede' })
  @IsString()
  city: string;

  @ApiProperty({ example: 'SP', description: 'Estado (UF)' })
  @IsString()
  state: string;

  @ApiProperty({ example: 'Avenida Paulista', description: 'Logradouro / Rua' })
  @IsString()
  street: string;

  @ApiProperty({ example: 'Bela Vista', description: 'Bairro' })
  @IsString()
  neighborhood: string;

  @ApiProperty({ example: '89900000', description: 'CEP (somente números)' })
  @IsCep()
  @IsNotEmpty()
  cep: string;

  @ApiProperty({ example: 1000, description: 'Número do endereço' })
  @IsNumber()
  number: number;

  @ApiProperty({ example: 'João da Silva', description: 'Nome do responsável' })
  @IsString()
  @IsNotEmpty()
  responsibleName: string;

  @ApiProperty({
    example: '47999999999',
    description: 'Telefone de contato (somente números)',
  })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({
    example: 'senhaForte123!',
    description: 'Senha de acesso à plataforma',
  })
  @IsString()
  @IsNotEmpty()
  password: string;
}
