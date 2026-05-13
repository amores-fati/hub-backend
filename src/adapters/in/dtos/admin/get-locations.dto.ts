import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';

export enum LocationScope {
  STUDENT = 'STUDENT',
  COMPANY = 'COMPANY',
}

export class GetLocationsQueryDto {
  @ApiProperty({
    enum: LocationScope,
    description: 'Escopo das localidades (estudantes ou empresas)',
  })
  @IsEnum(LocationScope, {
    message: 'O escopo deve ser STUDENT ou COMPANY',
  })
  @IsNotEmpty({ message: 'O escopo é obrigatório' })
  scope: LocationScope;
}

export class LocationResponseDto {
  @ApiProperty({ example: 'Porto Alegre' })
  city: string;

  @ApiProperty({ example: 'RS' })
  uf: string;
}
