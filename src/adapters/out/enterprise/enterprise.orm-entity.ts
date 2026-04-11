import{
    Entity,
    Column,
    PrimaryColumn,
    OneToOne,
    JoinColumn,
} from 'typeorm';
import { ContactOrmEntity } from '../contact/contact.orm-entity';

@Entity('enterprises')
export class EnterpriseOrmEntity {
    
  @PrimaryColumn('uuid')
  id: string;
    @OneToOne(() => ContactOrmEntity, { cascade: true, onDelete: 'CASCADE' })   
    @JoinColumn()
    contact: ContactOrmEntity;

  @Column()
  cnpj: string;
  
  @Column({ nullable: true })
  responsible: string;
}