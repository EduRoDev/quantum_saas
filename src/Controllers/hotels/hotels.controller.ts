import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { Hotel } from 'src/Models/hotels.models';
import { HotelsService } from 'src/Services/hotels/hotels.service';

@Controller('hotels')
export class HotelsController {
    constructor(
        private hotelsService: HotelsService
    ){}

    @Get('all')
    async findAll(): Promise<Hotel[]>{
        return await this.hotelsService.findAll();
    }

    @Get(':id')
    async findOne(@Param('id') id: number): Promise<Hotel>{
        return await this.hotelsService.findOne(id);
    }

    @Post('create')
    async create(@Body()newHotel: Hotel): Promise<Hotel>{
        return await this.hotelsService.create(newHotel);
    }

    @Patch(':id')
    async update(@Param('id') id: number, @Body() dataHotel: Partial<Hotel>): Promise<Hotel>{
        return await this.hotelsService.update(id, dataHotel);
    }

    @Delete(':id')
    async remove(@Param('id') id: number): Promise<string>{
        return await this.hotelsService.remove(id);
    }
}
