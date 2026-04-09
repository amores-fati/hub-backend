import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiCreatedResponse,
  ApiBadRequestResponse,
  ApiConflictResponse,
} from '@nestjs/swagger';
import { CreateCompanyDto } from './create-company.dto';
import { CompanyService } from 'src/core/services/company.service';

@ApiTags('Companies')
@Controller('companies')
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registra uma nova empresa',
    description:
      'Recebe os dados da empresa e orquestra o caso de uso de registro na camada Core.',
  })
  @ApiBody({
    type: CreateCompanyDto,
    description:
      'Payload contendo nome, razão social, CNPJ, endereço, responsável e senha.',
  })
  @ApiCreatedResponse({
    description: 'Empresa registrada com sucesso. Retorna o token de acesso.',
    schema: {
      example: {
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        role: 'company',
      },
    },
  })
  @ApiBadRequestResponse({
    description:
      'Erro de validação (ex: campos obrigatórios ausentes, CNPJ inválido). Retorna detalhes pelo class-validator.',
  })
  @ApiConflictResponse({
    description: 'E-mail ou CNPJ já cadastrado na plataforma.',
  })
  async register(@Body() CreateCompanyDto: CreateCompanyDto) {
    return this.companyService.createCompany(
      CreateCompanyDto.name, 
      CreateCompanyDto.cnpj, 
      CreateCompanyDto.email, 
      CreateCompanyDto.city, 
      CreateCompanyDto.state, 
      CreateCompanyDto.street, 
      CreateCompanyDto.neighborhood, 
      CreateCompanyDto.cep, 
      CreateCompanyDto.number, 
      CreateCompanyDto.responsibleName, 
      CreateCompanyDto.phone, 
      CreateCompanyDto.password
    );
  }
}
