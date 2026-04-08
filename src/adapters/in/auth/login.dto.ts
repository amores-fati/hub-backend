import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'usuario@exemplo.com' })
  @IsEmail({}, { message: 'email deve ser um e-mail válido' })
  email: string;

  @ApiProperty({ example: 'SenhaSegura@123' })
  @IsString()
  @IsNotEmpty()
  password: string;
}
