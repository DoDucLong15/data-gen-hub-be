import { AbstractAuditingEntity } from '../../base/entities/abstract-auditing-entity';
import { Column, Entity, ManyToMany, OneToMany } from 'typeorm';
import { UserEntity } from '../../users/entities/user.entity';
import { PermissionEntity } from 'src/permissions/entities/permission.entity';

@Entity('roles')
export class RoleEnity extends AbstractAuditingEntity {
  @Column({ type: 'varchar', unique: true })
  name: string;

  @Column({ type: 'varchar', nullable: true })
  description: string;

  @OneToMany(() => UserEntity, (user) => user.role, {
    cascade: true,
  })
  users: UserEntity[];

  @ManyToMany(() => PermissionEntity, (permission) => permission.roles, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    eager: true,
  })
  permissions: PermissionEntity[];
}
