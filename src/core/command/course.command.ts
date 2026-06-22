import { CourseStatus } from '../domain/course-status.enum';

export interface CreateCourseCommand {
  name: string;
  banner?: string;
  bannerImage?: Buffer;
  bannerImageMimeType?: string;
  description?: string;
  courseLoad: string;
  startDate: string;
  endDate: string;
  startRegistrations: string;
  endRegistrations: string;
  modality: string;
  linkAccess?: string;
  vacancyCount: number;
  status?: CourseStatus;
  shift: string;
  address?: string;
}

export interface UpdateCourseCommand {
  name: string;
  banner?: string;
  bannerImage?: Buffer;
  bannerImageMimeType?: string;
  description?: string;
  courseLoad: string;
  startDate: string;
  endDate: string;
  startRegistrations: string;
  endRegistrations: string;
  modality: string;
  linkAccess?: string;
  vacancyCount: number;
  status?: CourseStatus;
  shift: string;
  address?: string;
}
