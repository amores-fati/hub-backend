import { User } from './user.entity';

export class Admin extends User {
  constructor(id: string, email: string, password: string) {
    super(id, email, password);
  }
}
