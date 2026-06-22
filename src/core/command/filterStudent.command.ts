export interface FilterStudentCommand {
  search?: string;
  city?: string[];
  disabilityType?: string[];
  modality?: string;
  page?: number;
  pageSize?: 20 | 50;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
