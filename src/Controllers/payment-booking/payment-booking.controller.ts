import { Body, Controller, Get, Param, Patch, Post} from '@nestjs/common';
import { PaymentBookingService } from 'src/Services/payment-booking/payment-booking.service';
import { PaymentReservation } from 'src/Models/pago_reserva.models';

@Controller('payment-booking')
export class PaymentBookingController {
    constructor(
        private readonly paymentBookingService: PaymentBookingService
    ) {}

    @Get()
    async findAll() {
        return await this.paymentBookingService.findAll();
    }

    @Get(':id')
    async findOne(@Param('id') id: number) {
        return await this.paymentBookingService.findOne(id);
    }

    @Get('client/:id')
    async findAllByClient(@Param('id') id: number) {
        return await this.paymentBookingService.findAllByClient(id);
    }

    @Get('status/:status/hotel/:hotelId')
    async findByStatus(@Param('status') status: string, @Param('hotelId') hotelId: number) {
        return await this.paymentBookingService.findByStatus(status,hotelId);
    }

    @Get('method/:method/hotel/:hotelId')
    async findByMethod(@Param('method') method: string, @Param('hotelId') hotelId: number) {
        return await this.paymentBookingService.findByMethod(method,hotelId);
    }

    @Get('name/:name/hotel/:id')
    async findByName(@Param('name') name: string, @Param('id') id: number){
        return await this.paymentBookingService.findByNameClient(name,id)
    }

    @Get('room/:id')
    async findAllByRoom(@Param('id') id: number) {
        return await this.paymentBookingService.findAllByRoom(id);
    }

    @Get('reservation/:id')
    async findAllByReservation(@Param('id') id: number) {
        return await this.paymentBookingService.findAllByReservation(id);
    }
    
    @Get('hotel/:id')
    async findAllByHotel(@Param('id') id: number) {
        return await this.paymentBookingService.findAllByHotel(id);
    }

    @Post()
    async create(@Body() data: PaymentReservation) {
        return await this.paymentBookingService.create(data);
    }

    @Patch('refund/:id')
    async paymentRefunded(@Param('id') id: number) {
        return await this.paymentBookingService.paymentRefunded(id);
    }

    @Patch('cancel/:id')
    async paymentCanceled(@Param('id') id: number) {
        return await this.paymentBookingService.paymentCanceled(id);
    }
}
