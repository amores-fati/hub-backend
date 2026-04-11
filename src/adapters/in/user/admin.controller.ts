import { Controller, Get, Logger } from '@nestjs/common';
import { DashboardService } from 'src/core/services/dashboard.service';

@Controller('admin')
export class AdminController {
  constructor(
    private readonly dashboardService: DashboardService
  ) {}

  @Get('dashboard')
  async getDashboard() {
    Logger.log('GET /admin/dashboard');
    return this.dashboardService.getDashboard();
  }
}