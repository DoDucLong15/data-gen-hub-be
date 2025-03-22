import { AbstractAuditingEntity } from '../../base/entities/abstract-auditing-entity';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { RoleEnity } from '../../roles/entities/role.entity';
import { Exclude, Expose } from 'class-transformer';
import { ClassEntity } from '../../class/entities/class.entity';

@Entity('users')
export class UserEntity extends AbstractAuditingEntity {
  @Column({ type: 'varchar', unique: true })
  email: string;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'varchar', nullable: true })
  phone: string;

  @Column({ type: 'varchar', nullable: true })
  school: string;

  @Column({ type: 'varchar', nullable: true })
  department: string;

  @Column({ type: 'varchar', nullable: true })
  position: string;

  @ManyToOne(() => RoleEnity, (role) => role.users, {
    nullable: false,
    eager: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'role_id' })
  role: RoleEnity;

  @Exclude({ toPlainOnly: true })
  @Column({ type: 'varchar' })
  role_id: string;

  @Expose({ name: 'roleName' })
  get roleName(): string {
    return this.role.name;
  }

  @OneToMany(() => ClassEntity, (classEntity) => classEntity.teacher, {
    cascade: true,
  })
  classes: ClassEntity[];
}
