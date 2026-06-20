import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateSettingDto {
  @ApiProperty({
    example: '+5551999999999',
    description: 'Novo valor da configuração',
  })
  @IsString()
  @IsNotEmpty()
  value: string;
}
