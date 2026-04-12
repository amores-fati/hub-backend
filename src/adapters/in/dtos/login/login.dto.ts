import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'pedro@email.com', description: 'Email do usuário' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    example: 'SenhaForte123!',
    description: 'Senha do usuário',
  })
  @IsString()
  @IsNotEmpty()
  password: string;
}
