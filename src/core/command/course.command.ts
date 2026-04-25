export interface CreateCourseCommand {
  name: string;
  banner: string;
  description?: string;
  courseLoad: string;
  startDate: string;
  endDate: string;
  startRegistrations: string;
  endRegistrations: string;
  linkAccess: string;
}
