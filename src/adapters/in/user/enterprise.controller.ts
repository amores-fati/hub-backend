import { Controller, Get, Query, Inject } from '@nestjs/common';
import { ICourseRepository } from 'src/core/ports/course.repository.interface';

@Controller('api/job-openings')
export class EnterpriseController {
  constructor(
    @Inject(ICourseRepository)
    private readonly courseRepo: ICourseRepository,
  ) {}

  @Get()
  async findJobOpenings(
    @Query('term') term?: string,
    @Query('location') location?: string,
    @Query('any_disability') any_disability?: boolean,
    @Query('page') page: number = 1,
  ) {
    return this.courseRepo.findJobOpenings({
      term,
      location,
      any_disability,
      page,
    });
  }
}
