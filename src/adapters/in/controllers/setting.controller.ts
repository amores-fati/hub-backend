import {
  Controller,
  Get,
  Param,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { SettingService } from '../../../core/services/setting.service';
import { SettingNotFoundException } from '../../../core/exceptions/setting-not-found.exception';
import { AmoresFatiLogger } from '../../../utils/logger';

@ApiTags('Settings')
@Controller('settings')
export class SettingController {
  constructor(
    private readonly settingService: SettingService,
    private readonly logger: AmoresFatiLogger,
  ) {
    this.logger.setContext(SettingController.name);
  }

  @Get('public/:key')
  @ApiOperation({
    summary: 'Busca uma configuração pública pela chave',
    description: 'Retorna o objeto { key, value } se a configuração existir.',
  })
  @ApiOkResponse({
    description: 'Configuração encontrada com sucesso.',
    schema: {
      example: {
        key: 'whatsapp_phone',
        value: '+5551999999999',
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Configuração não encontrada.',
    schema: {
      example: {
        statusCode: 404,
        message: 'Configuração não encontrada para a chave: whatsapp_phone',
        error: 'Not Found',
        errorKind: 'NOT_FOUND',
      },
    },
  })
  async getPublicSetting(@Param('key') key: string) {
    try {
      this.logger.info(`Iniciando busca da configuração pública para a chave: ${key}`);
      const result = await this.settingService.getSettingByKey(key);
      this.logger.info(`Configuração encontrada para a chave: ${key}`);
      return result;
    } catch (error) {
      if (error instanceof SettingNotFoundException) {
        this.logger.warn(`Configuração não encontrada para a chave: ${key}`);
        throw new NotFoundException({
          statusCode: 404,
          message: error.message,
          error: 'Not Found',
          errorKind: 'NOT_FOUND',
        });
      }
      throw error;
    }
  }
}
