import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { Room } from 'src/Models/rooms.models';
import { RoomsService } from 'src/Services/rooms/rooms.service';

@Controller('rooms')
export class RoomsController {
    constructor(
        private roomsService: RoomsService
    ){}

    @Get('all')
    async findAll(){
        return await this.roomsService.findAll()
    }

    @Get(':id')
    async findById(@Param('id') id: number){
        return await this.roomsService.findById(id)
    }

    @Get(':name')
    async findByName(@Param('name') name: string){
        return await this.roomsService.findByName(name)
    }

    @Get(':id/reservations')
    async findReservations(@Param('id') id: number){
        return await this.roomsService.findReservations(id)
    }

    @Post('create')
    async create(@Body() data: Room){
        return await this.roomsService.create(data)
    }

    @Patch(':id')
    async update(@Param('id') id: number, @Body() data: Partial<Room>){
        return await this.roomsService.update(id, data)
    }

    @Delete(':id')
    async remove(@Param('id') id: number){
        return await this.roomsService.remove(id)
    }
}
