import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { Client } from 'src/Models/clients.models';
import { ClientsService } from 'src/Services/clients/clients.service';

@Controller('clients')

export class ClientsController {
    constructor(
        private clientsService: ClientsService
    ){}

    @Get('all')
    async findAll(){
        return await this.clientsService.findAll();
    }

    @Get(':id')
    async findOne(@Param('id', ParseIntPipe) id: number){
        return await this.clientsService.findOne(id)
    }

    @Get(':id/reservations')
    async findReservations(@Param('id', ParseIntPipe) id: number){
        return await this.clientsService.findReservations(id)
    }

    @Get('by-admin/:adminId')
    async findByAdmin(
      @Param('adminId', ParseIntPipe) adminId: number
    ) {
      return await this.clientsService.findClientsByAdmin(adminId);
    }

    @Get('by-name/:name')
    async findOneByName(@Param('name') name: string){
        return await this.clientsService.findOneByName(name)
    }

    @Get('by-email/:email')
    async findOneByEmail(@Param('email') email: string){
        return await this.clientsService.findOneByEmail(email)
    }

    @Post('create')
    async create(@Body() data: Client){
        return await this.clientsService.create(data)
    }

    @Patch(':id')
    async update(@Param('id', ParseIntPipe) id: number, @Body() data: Partial<Client>){
        return await this.clientsService.update(id, data)
    }

    @Delete(':id')
    async remove(@Param('id', ParseIntPipe) id: number){
        return await this.clientsService.remove(id)
    }
}
