import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { BookingService } from 'src/Services/booking/booking.service';
import { Reservation } from 'src/Models/reservations.models';

@Controller('booking')
export class BookingController {
    constructor(private readonly bookingService: BookingService) {}

    @Get()
    async findAll() {
        return await this.bookingService.findAll();
    }

    @Get(':id')
    async findOne(@Param('id') id: number) {
        return await this.bookingService.findOne(id);
    }

    @Get('client/:id')
    async findByClient(@Param('id') id: number) {
        return await this.bookingService.findByClient(id);
    }

    @Get(':hotelId/insights')
    async getReservationInsights(@Param('hotelId') hotelId: number) {
        return await this.bookingService.getReservationInsights(hotelId);
    }

    @Post()
    async create(@Body() data: Reservation) {
        return await this.bookingService.create(data);
    }

    @Patch(':id')
    async update(@Param('id') id: number, @Body() data: Partial<Reservation>) {
        return await this.bookingService.update(id, data);
    }

    @Delete(':id')
    async remove(@Param('id') id: number) {
        return await this.bookingService.remove(id);
    }

    @Patch('cancel/:id')
    async bookingCanceled(@Param('id') id: number) {
        return await this.bookingService.bookingCanceled(id);
    }
}
