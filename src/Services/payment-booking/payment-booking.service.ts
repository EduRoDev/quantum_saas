import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Client } from 'src/Models/clients.models';
import { PaymentReservation } from 'src/Models/pago_reserva.models';
import { Reservation } from 'src/Models/reservations.models';
import { Room } from 'src/Models/rooms.models';
import { DataSource, Repository } from 'typeorm';

@Injectable()
export class PaymentBookingService {
    constructor(
        @InjectRepository(PaymentReservation)
        private paymentBookingRepository: Repository<PaymentReservation>,
        @InjectRepository(Reservation)
        private reservationRepository: Repository<Reservation>,
        @InjectRepository(Client)
        private clientRepository: Repository<Client>,
        @InjectRepository(Room)
        private roomRepository: Repository<Room>,
        private datasource: DataSource
    ){}

    async findAll(): Promise<PaymentReservation[]> {
        const payment = await this.paymentBookingRepository.find()
        if ( payment.length === 0) throw new NotFoundException('No payment found')
        return payment
    }

    async findOne(id: number): Promise<PaymentReservation> {
        const payment = await this.paymentBookingRepository.findOne({
            where: { id },
            relations: ['reservation']
        })
        if (!payment) throw new NotFoundException('Payment not found')
        return payment
    }
    
    async findAllByClient(id: number): Promise<PaymentReservation[]> {
        const payment = await this.paymentBookingRepository.find({
            where: { client: {id: id}},
            relations: ['reservation']
        })
        if ( payment.length === 0) throw new NotFoundException('No payment found')
        return payment
    }

    async findAllByRoom(id: number): Promise<PaymentReservation[]> {
        const payment = await this.paymentBookingRepository.find({
            where: { room: {id: id}},
            relations: ['reservation']
        })
        if ( payment.length === 0) throw new NotFoundException('No payment found')
        return payment
    }

    async findAllByReservation(id: number): Promise<PaymentReservation[]> {
        const payment = await this.paymentBookingRepository.find({
            where: { reservation: {id: id}},
            relations: ['reservation']
        })
        if ( payment.length === 0) throw new NotFoundException('No payment found')
        return payment
    }

    async create(data: PaymentReservation): Promise<PaymentReservation> {
        const result = await this.datasource.transaction( async (manager) => {
            const [client, reservation, room] = await Promise.all([
                this.clientRepository.findOne({ where: { id: data.client.id } }),
                this.reservationRepository.findOne({ where: { id: data.reservation.id } }),
                this.roomRepository.findOne({ where: { id: data.room.id } })
            ])
            if (!client) throw new NotFoundException('Client not found')
            if (!reservation) throw new NotFoundException('Reservation not found')
            if (!room) throw new NotFoundException('Room not found')
            
            const payment = manager.create(PaymentReservation, {
                ...data,
                client: client,
                reservation: reservation,
                room: room
            })

            const paymentSave = await manager.save(PaymentReservation, payment)
            await new Promise((resolve) => setTimeout(resolve, 2000))

            paymentSave.status = 'confirmed'
            await manager.save(PaymentReservation, paymentSave)

            reservation.status = 'confirmed'
            await manager.save(Reservation, reservation)

            room.status = 'busy'
            await manager.save(Room, room)

            return paymentSave
        })
        return result
    }

    async paymentRefunded(id: number): Promise<PaymentReservation> {
        const payment = await this.datasource.transaction( async (manager) => {
            const payment = await this.paymentBookingRepository.findOne({
                where: { id },
                relations: ['reservation']
            })
            if (!payment) throw new NotFoundException('Payment not found')
            if (payment.status !== 'confirmed') throw new NotFoundException('Payment not confirmed')
            
            const reservation = await this.reservationRepository.findOne({
                where: { id: payment.reservation.id },
                relations: ['room']
            })
            if (!reservation) throw new NotFoundException('Reservation not found')
            if (reservation.status !== 'confirmed') throw new NotFoundException('Reservation not confirmed')

            const room = await this.roomRepository.findOne({
                where: { id: reservation.room.id },
                relations: ['hotel']
            })
            if (!room) throw new NotFoundException('Room not found')
            if (room.status !== 'busy') throw new NotFoundException('Room not busy')

            payment.status = 'refunded'
            await manager.save(PaymentReservation, payment)

            reservation.status = 'refunded'
            await manager.save(Reservation, reservation)

            room.status = 'free'
            await manager.save(Room, room)

            return payment
        })
        return payment
    }

    async paymentCanceled(id: number): Promise<PaymentReservation>{
        const payment = this.datasource.transaction( async (manager) => {
            const payment = await manager.findOne(PaymentReservation, {
                where: { id: id },
                relations: ['reservation', 'client', 'room']
            })
            if (!payment) throw new NotFoundException('Payment not found')
            if (payment.status !== 'confirmed') throw new NotFoundException('Payment not confirmed')
            
            payment.status = 'canceled'
            const updatePayment = await manager.save(PaymentReservation, payment)

            if(payment.reservation){
                payment.reservation.status = 'canceled'
                await manager.save(Reservation, payment.reservation)
            }

            if(payment.room){
                payment.room.status = 'free'
                await manager.save(Room, payment.room)
            }
            return updatePayment
        })
        return payment
    }
    

}
