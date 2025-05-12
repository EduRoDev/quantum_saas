import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { super_admin } from 'src/Models/super_admin.models';
import { SuperAdminService } from 'src/Services/super_admin/super_admin.service';

@Controller('super-admin')
export class SuperAdminController {
    constructor(
        private readonly superAdminService: SuperAdminService,
    ){}
    
    @Post('create')
    async create(@Body() data: super_admin): Promise<super_admin> {
        return this.superAdminService.createSuperAdmin(data);

    }

    @Get(':id')
    async findById(@Param('id') id: number): Promise<super_admin> {
        return this.superAdminService.findAllsuperAdminById(id);
    }
}
