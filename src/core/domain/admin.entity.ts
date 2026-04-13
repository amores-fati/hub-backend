import { User } from './user.entity';
import { UserRoleEnum } from './enums/user-role.enum';

export class Admin extends User {
  constructor(id: string, email: string, password: string) {
    super(id, email, password, UserRoleEnum.ADMIN);
  }
}
