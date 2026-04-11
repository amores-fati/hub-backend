import { Controller, Get, Query, Inject } from '@nestjs/common';

import type { IUserRepository } from 'src/core/ports/user.repository.interface';
import { IUserRepository as USER_REPO } from 'src/core/ports/user.repository.interface';

@Controller('api/student')
    export class StudentController {

    constructor(
    @Inject(USER_REPO)
        private readonly userRepo: IUserRepository
    ){}

    @Get()
        async findStudents(
            @Query('term') term?: string,
            @Query('location') location?: string,
            @Query('any_disability') any_disability?: boolean,
            @Query('profile') profile?: string,
            @Query('page') page: number = 1
        ){
        return this.userRepo.findStudents({
            term,
            location,
            any_disability,
            profile,
            page
        });
        }
    @Get('range')
        async studentsRange(
            @Query('date_register_begin') date_register_begin: string,
            @Query('date_register_end') date_register_end: string
        ){
        return this.userRepo.studentsRange({
            date_register_begin,
            date_register_end
        });
    }
}