import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity('settings')
export class SettingOrmEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ unique: true })
  key: string;

  @Column({ type: 'text' })
  value: string;
}
