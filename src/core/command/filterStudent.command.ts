export interface FilterStudentCommand {
  cpf: string;
  text: string;
  textFilter?: string;
  courseType?: string;
  location?: string;
  disability?: string;
}
