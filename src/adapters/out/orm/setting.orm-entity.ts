import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity('settings')
export class SettingOrmEntity {
  @PrimaryColumn({ length: 100 })
  key: string;

  @Column({ type: 'text' })
  value: string;
}
