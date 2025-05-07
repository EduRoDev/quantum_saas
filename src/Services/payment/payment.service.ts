import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Payment } from 'src/Models/payment_services.models';
import { User } from 'src/Models/users.models';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class PaymentService {
    constructor(
        @InjectRepository(Payment)
        private paymentRepository: Repository<Payment>,
        @InjectRepository(User)
        private userRepository: Repository<User>,
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

    async create(payment: Payment): Promise<{ payment: Payment}> {
        if (payment.price <= 0) throw new Error('the price must be greater than 0');
        if (!['PREMIUN', 'VIP'].includes(payment.name)) throw new Error('the name must be PREMIUN or VIP');
        payment.active = true;
        const newPayment = this.paymentRepository.create(payment);
        const savedPayment = await this.paymentRepository.save(newPayment);
        if (savedPayment.user) {
            const user = await this.userRepository.findOne({
                where: { id: savedPayment.user.id },
                relations: ['payments']
            });
            
            if (user) {
                const activePayments = user.payments.filter(p => p.active);
                user.has_premium_service = activePayments.some(p => p.name === 'PREMIUN');
                user.has_vip_service = activePayments.some(p => p.name === 'VIP');
                await this.userRepository.save(user);
            }
        }
        return { payment: savedPayment};
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
        const updatedPayment = await this.paymentRepository.save(result);

        if (updatedPayment.user) {
            const user = await this.userRepository.findOne({
                where: { id: updatedPayment.user.id },
                relations: ['payments']
            });
            
            if (user) {
                const activePayments = user.payments.filter(p => p.active);
                user.has_premium_service = activePayments.some(p => p.name === 'PREMIUN');
                user.has_vip_service = activePayments.some(p => p.name === 'VIP');
                await this.userRepository.save(user);
            }
        }
        return updatedPayment;
    }

    async remove(id: number): Promise<string>{
        const result = await this.findById(id);
        if (!result) throw new NotFoundException('Payment not found');
        await this.paymentRepository.delete(result);
        return 'Payment deleted successfully ';
    }

    async cancelService(paymentId: number): Promise<Payment> {
        const payment = await this.findById(paymentId);
        payment.active = false;
        return await this.update(paymentId, payment);
    }

    async findByPremiumService(userId: number): Promise<Payment[]> {
        const user = await this.userRepository.findOne({ where: { id: userId }, relations: ['payments'] });
        if (!user) throw new NotFoundException('User not found');
        const payments = user.payments.filter(payment => payment.name === 'PREMIUN' && payment.active);
        if (payments.length === 0) throw new NotFoundException('No active premium services found for this user');
        return payments;
    }

    async findByVipService(userId: number): Promise<Payment[]> {
        const user = await this.userRepository.findOne({ where: { id: userId }, relations: ['payments'] });
        if (!user) throw new NotFoundException('User not found');
        const payments = user.payments.filter(payment => payment.name === 'VIP' && payment.active);
        if (payments.length === 0) throw new NotFoundException('No active VIP services found for this user');
        return payments;
    }

    async findAllUsersWithPremiumService(): Promise<Payment[]> {
        const payments = await this.paymentRepository.find({ relations: ['user'] });
        return payments.filter(payment => payment.name === 'PREMIUN' && payment.active);

    }

    async findAllUsersWithVipService(): Promise<Payment[]> {
        const payments = await this.paymentRepository.find({ relations: ['user'] });
        return payments.filter(payment => payment.name === 'VIP' && payment.active);
    }

}
