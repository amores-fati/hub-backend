export interface CreateCourseCommand {
  name: string;
  banner: string;
  description?: string;
  courseLoad: string;
  startDate: string;
  endDate: string;
  startRegistrations: string;
  endRegistrations: string;
  modality: string;
  linkAccess: string;
  vacancyCount: number;
}

export interface AdminCourseCommand {
  name: string;
  description: string;
  modality: string;
  shift: string;
  imageUrl?: string;
  address?: string;
  vacancyCount?: number;
  workloadHours?: number;
  startDate?: string;
  endDate?: string;
  enrollmentStart?: string;
  enrollmentEnd?: string;
}
