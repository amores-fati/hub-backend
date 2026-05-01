import { DomainException } from './domain.exception';

export class CourseNotFoundException extends DomainException {
  constructor(id: string) {
    super(`Curso não encontrado: ${id}`);
    this.name = 'CourseNotFoundException';
  }
}
