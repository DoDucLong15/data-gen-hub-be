import { BadRequestException, Injectable } from "@nestjs/common";
import { Repository } from "typeorm";
import { RoleEnity } from "../entities/role.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { RoleTypes } from "../enums/role-types.enum";

@Injectable()
export class RoleService {
  constructor(
    @InjectRepository(RoleEnity)
    private readonly roleRepository: Repository<RoleEnity>,
  ){}

  async findRoleByName(name: RoleTypes): Promise<RoleEnity> {
    const role = await this.roleRepository.findOne({
      where: {name}
    })
    if(!role) {
      throw new BadRequestException('Role not found');
    }
    return role;
  }
}