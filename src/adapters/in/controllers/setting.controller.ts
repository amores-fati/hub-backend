import { Controller, Get, Logger, NotFoundException, Param } from '@nestjs/common';
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { SettingService } from '../../../core/services/setting.service';

@ApiTags('Settings')
@Controller('settings')
export class SettingController {
  private readonly logger = new Logger(SettingController.name);

  constructor(private readonly settingService: SettingService) {}

  @Get('public/:key')
  @ApiOperation({
    summary: 'Busca uma configuracao publica por chave',
    description:
      'Retorna o valor de uma configuracao publica. Endpoint publico, nao requer autenticacao.',
  })
  @ApiOkResponse({
    description: 'Configuracao encontrada com sucesso.',
    schema: {
      example: { key: 'support_whatsapp_number', value: '5511999999999' },
    },
  })
  @ApiNotFoundResponse({
    description: 'Configuracao nao encontrada.',
    schema: {
      example: {
        statusCode: 404,
        message: 'Configuracao nao encontrada',
        errorKind: 'NOT_FOUND',
      },
    },
  })
  async getPublicSetting(@Param('key') key: string) {
    this.logger.log(`GET /settings/public/${key} - iniciando busca de configuracao`);
    const setting = await this.settingService.getPublicSetting(key);

    if (!setting) {
      throw new NotFoundException('Configuracao nao encontrada');
    }

    return setting;
  }
}
