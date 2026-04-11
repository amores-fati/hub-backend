import { Injectable } from '@nestjs/common';
import { IUserRepository } from '../ports/user.repository.interface';
import { ICourseRepository } from '../ports/course.repository.interface';

@Injectable()
export class DashboardService {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly courseRepo: ICourseRepository,
  ) {}
  async getDashboard() {
    const [
      stats,
      enrollmentsByMonth,
      statusDistribution,
      studentsPerCourse,
      impactTimeline,
    ] = await Promise.all([
      this.getStats(),
      this.getEnrollmentsByMonth(),
      this.getStatusDistribution(),
      this.getStudentsPerCourse(),
      this.getImpactTimeline(),
    ]);
    return {
      stats,
      enrollmentsByMonth,
      statusDistribution,
      studentsPerCourse,
      impactTimeline,
    };
  }
  private async getStats() {
    const [totalStudents, totalPcd, totalActiveVacancies, totalEmployed] =
      await Promise.all([
        this.userRepo.countStudents(),
        this.userRepo.countPcd(),
        this.courseRepo.countVacancies(),
        this.userRepo.countEmployed(),
      ]);
    return {
      totalStudents,
      totalPcd,
      totalActiveVacancies,
      totalEmployed,
    };
  }
  private async getEnrollmentsByMonth() {
    return this.userRepo.enrollmentsByMonth();
  }
  private async getStatusDistribution() {
    return this.userRepo.statusDistribution();
  }
  private async getStudentsPerCourse() {
    return this.courseRepo.studentsPerCourse();
  }
  private async getImpactTimeline() {
    const [students, courses] = await Promise.all([
      this.courseRepo.impactTimeline(),
      this.userRepo.timeline(),
    ]);
    const timeline = [...students, ...courses];
    return timeline.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  }
}
