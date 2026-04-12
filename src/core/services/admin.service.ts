import { Admin } from '../domain/admin.entity';
import { IUserRepository } from '../ports/user.repository.interface';
import { UserAlreadyExistsException } from '../exceptions/user-already-exists.exception';
import { IHashService } from '../ports/hash.service.interface';
import { CreateAdminCommand } from '../command/admin.command';
import { randomUUID } from 'crypto';
import { IAdminRepository } from '../ports/admin.repository.interface';

export class AdminService {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly adminRepository: IAdminRepository,
    private readonly hashService: IHashService,
  ) {}

  async createAdmin(command: CreateAdminCommand): Promise<Admin> {
    const existingUser = await this.userRepository.findByEmail(command.email);

    if (existingUser) {
      throw new UserAlreadyExistsException(command.email);
    }

    const hashedPassword = await this.hashService.hash(command.password);
    
    const adminUser = new Admin(randomUUID(), command.email, hashedPassword);
    
    return this.adminRepository.create(adminUser);
  }
}