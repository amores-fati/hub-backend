import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class ForgotPasswordDto {
  @ApiProperty({
    example: 'usuario@email.com',
    description: 'Email da conta que recebera o link de redefinicao',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
