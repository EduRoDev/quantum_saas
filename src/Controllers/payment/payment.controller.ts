import { Body, Controller, Delete, Get, Param, Patch, Post} from '@nestjs/common';
import { Payment } from 'src/Models/payment_services.models';
import { PaymentService } from 'src/Services/payment/payment.service';

@Controller('payment')
export class PaymentController {
    constructor(
        private readonly paymentService: PaymentService
    ){}

    @Get('all')
    async findAll(){
        return await this.paymentService.findAll();
    }

    @Get(':id')
    async findById(@Param('id') id: number){
        return await this.paymentService.findById(id);
    }

    @Post('create')
    async create(@Body() payment: Payment){
        return await this.paymentService.create(payment);
    }

    @Patch(':id')
    async update(@Param('id') id: number, @Body() payment: Payment){
        return await this.paymentService.update(id, payment);
    }

    @Patch('services/cancel/:paymentId')
    async cancelService(@Param('paymentId') paymentId: number) {
        return await this.paymentService.cancelService(paymentId);
    }

    @Delete(':id')
    async remove(@Param('id') id: number){
        return await this.paymentService.remove(id);
    }

    @Get('users/premium')
    async findAllUsersWithPremiumService() {
        return await this.paymentService.findAllUsersWithPremiumService();
    }

    @Get('users/vip')
    async findAllUsersWithVipService() {
        return await this.paymentService.findAllUsersWithVipService();
    }
}
