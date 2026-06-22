import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({
    example: 'token_recebido_por_email',
    description: 'Token recebido no link de recuperacao de senha',
  })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({
    example: 'NovaSenha123!',
    description: 'Nova senha da conta',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8, { message: 'A nova senha deve ter no minimo 8 caracteres' })
  @MaxLength(100)
  newPassword: string;
}
