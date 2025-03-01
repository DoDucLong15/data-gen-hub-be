import { AbstractAuditingEntity } from "../../base/entities/abstract-auditing-entity";
import { Column, Entity, OneToMany } from "typeorm";
import { UserEntity } from "./user.entity";
import { RoleTypes } from "../enums/role-types.enum";

@Entity('roles')
export class RoleEnity extends AbstractAuditingEntity {
  @Column({ type: 'varchar', unique: true })
  name: RoleTypes;

  @OneToMany(() => UserEntity, (user) => user.role, {
    cascade: true,
  })
  users: UserEntity[];
}