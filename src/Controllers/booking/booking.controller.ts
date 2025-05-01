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

    @Get('hotel/reservation/:hotelId')
    async findByHotel(@Param('hotelId') hotelId: number) {
        return await this.bookingService.findByHotel(hotelId);
    }

    @Get('status/:status')
    async findByStatus(@Param('status') status: string) {
        return await this.bookingService.findByStatus(status);
    }

    @Get('status/:status/hotel/:hotelId')
    async findByStatusByHotel( @Param('status') status: string, @Param('hotelId') hotelId: number) {
        return await this.bookingService.findByStatusByHotel(status, hotelId);
    }

    @Get(':hotelId/insights')
    async getReservationInsights(@Param('hotelId') hotelId: number) {
        return await this.bookingService.getReservationInsights(hotelId);
    }

    @Get('reservation/:id/client/:clientId')
    async getReservationByClient(@Param("id") id: number, @Param("clientId") clientId: number){
        return await this.bookingService.findBookingClient(id, clientId)
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
