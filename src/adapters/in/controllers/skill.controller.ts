import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse } from '@nestjs/swagger';
import { SkillService } from '../../../core/services/skill.service';
import { AmoresFatiLogger } from '../../../utils/logger';

@ApiTags('Skills')
@Controller('skills')
export class SkillController {
  constructor(
    private readonly skillService: SkillService,
    private readonly logger: AmoresFatiLogger,
  ) {
    this.logger.setContext(SkillController.name);
  }

  @Get()
  @ApiOperation({ summary: 'Lista todas as habilidades' })
  @ApiOkResponse({
    description: 'Lista de habilidades retornada com sucesso.',
    schema: {
      example: [
        { id: 'uuid', name: 'JavaScript' },
        { id: 'uuid', name: 'TypeScript' },
      ],
    },
  })
  async findAll() {
    this.logger.info('Listando todas as habilidades');
    return this.skillService.getAllSkills();
  }
}
