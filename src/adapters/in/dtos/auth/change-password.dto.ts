import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({
    example: 'SenhaAtual123!',
    description: 'Senha atual do usuario autenticado',
  })
  @IsString()
  @IsNotEmpty()
  currentPassword: string;

  @ApiProperty({
    example: 'NovaSenha123!',
    description: 'Nova senha do usuario autenticado',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8, { message: 'A nova senha deve ter no minimo 8 caracteres' })
  @MaxLength(100)
  newPassword: string;
}
