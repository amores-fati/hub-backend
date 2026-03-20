import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({
    example: 'Pedro da Silva Santos',
    description: 'Nome do usuário',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'pedro@email.com', description: 'Email do usuário' })
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
