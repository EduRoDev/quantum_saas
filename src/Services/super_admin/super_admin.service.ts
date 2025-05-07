import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { super_admin } from 'src/Models/super_admin.models';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

@Injectable()
export class SuperAdminService {
    constructor(
        @InjectRepository(super_admin)
        private superA: Repository<super_admin>
    ){}

    async findAllsuperAdminById(id: number): Promise<super_admin> {
        const superAdmin = await this.superA.findOne({ where: { id } });
        if (!superAdmin) throw new Error('Super Admin not found');
        return superAdmin;
    }

    async createSuperAdmin(data: super_admin): Promise<super_admin>{
        const salt = await bcrypt.genSalt();
        data.password = await bcrypt.hash(data.password, salt);
        const newSuperAdmin = this.superA.create(data);
        return await this.superA.save(newSuperAdmin);
    }

    async updateSuperAdmin(id: number, data: super_admin): Promise<super_admin> {
        const superAdmin = await this.superA.findOne({ where: { id } });
        if (!superAdmin) throw new Error('Super Admin not found');

        if (data.password) {
            const salt = await bcrypt.genSalt();
            data.password = await bcrypt.hash(data.password, salt);
        }

        this.superA.merge(superAdmin, data);
        return await this.superA.save(superAdmin);
    }

    async deleteSuperAdmin(id: number): Promise<void> {
        const superAdmin = await this.superA.findOne({ where: { id } });
        if (!superAdmin) throw new Error('Super Admin not found');
        await this.superA.remove(superAdmin);
    }

    
}
