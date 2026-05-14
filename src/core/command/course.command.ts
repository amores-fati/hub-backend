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

export interface UpdateCourseCommand {
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

