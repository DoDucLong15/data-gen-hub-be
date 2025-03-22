import { AbstractAuditingEntity } from 'src/base/entities/abstract-auditing-entity';
import { Column, Entity, JoinTable, ManyToMany } from 'typeorm';
import { RoleEnity } from 'src/roles/entities/role.entity';

@Entity('permissions')
export class PermissionEntity extends AbstractAuditingEntity {
  @Column({ type: 'varchar' })
  action: string;

  @Column({ type: 'varchar' })
  subject: string;

  @Column({ type: 'jsonb', nullable: true })
  fields: any;

  @Column({ type: 'jsonb', nullable: true })
  conditions: any;

  @Column({ type: 'varchar', nullable: true })
  description: string;

  @ManyToMany(() => RoleEnity, (role) => role.permissions)
  @JoinTable({
    name: 'role_permissions',
    joinColumn: {
      name: 'permission_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'role_id',
      referencedColumnName: 'id',
    },
  })
  roles: RoleEnity[];
}
