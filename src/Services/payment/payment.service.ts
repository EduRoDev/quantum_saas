import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Payment } from 'src/Models/payment_services.models';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class PaymentService {
    constructor(
        @InjectRepository(Payment)
        private paymentRepository: Repository<Payment>,
        private readonly jwtService: JwtService
    ){}

    async findAll(): Promise<Payment[]>{
        const result = await this.paymentRepository.find();
        if (result.length === 0) throw new NotFoundException('No payments found');
        return result;
    }

    async findById(id: number): Promise<Payment>{
        const result = await this.paymentRepository.findOne({
            where: {id},
            relations: ['user']
        })
        if (!result) throw new NotFoundException('Payment not found');
        return result;
    }

    async create(payment: Payment): Promise<{ payment: Payment; access_token: string }> {
        if (payment.price <= 0) throw new Error('the price must be greater than 0');
        if (!['PREMIUN', 'VIP'].includes(payment.name)) throw new Error('the name must be PREMIUN or VIP');
        payment.active = true;
        const newPayment = this.paymentRepository.create(payment);
        const savedPayment = await this.paymentRepository.save(newPayment);

        const tokenPayload = { sub: savedPayment.id, name: savedPayment.name };
        const access_token = this.jwtService.sign(tokenPayload);

        return { payment: savedPayment, access_token };
    }

    async update(id: number, payment: Payment): Promise<Payment> {
        const result = await this.paymentRepository.findOne({where: {id}});
        if (!result) throw new NotFoundException('Payment not found');
        if (payment.price <= 0) throw new Error('the price must be greater than 0');
        if (!['PREMIUN', 'VIP'].includes(payment.name)) throw new Error('the name must be PREMIUN or VIP');
        if (payment.active === false) payment.active = true;
        result.name = payment.name;
        result.description = payment.description;
        result.price = payment.price;
        result.active = payment.active;
        return await this.paymentRepository.save(result);
    }

    async remove(id: number): Promise<string>{
        const result = await this.findById(id);
        if (!result) throw new NotFoundException('Payment not found');
        const deleted = await this.paymentRepository.delete(result);
        return 'Payment deleted successfully ';
    }
}
