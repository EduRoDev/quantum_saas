import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Client } from 'src/Models/clients.models';
import { Reservation } from 'src/Models/reservations.models';
import { Room } from 'src/Models/rooms.models';
import { Between, Not, Repository } from 'typeorm';

@Injectable()
export class BookingService {
    constructor(
        @InjectRepository(Reservation)
        private readonly reservationRepository: Repository<Reservation>,
        @InjectRepository(Room)
        private readonly roomsRepository: Repository<Room>,
        @InjectRepository(Client)
        private readonly clientRepository: Repository<Client>,
    ){}

    async findAll(): Promise<Reservation[]> {
        const reservations = await this.reservationRepository.find({
            relations: ['room', 'client', 'payment'],
        });
        if (reservations.length === 0) throw new NotFoundException('No reservations found');
        return reservations;
    }

    async findOne(id: number): Promise<Reservation> {
        const reservation = await this.reservationRepository.findOne({
            where: { id },
            relations: ['room', 'client', 'payment'],
        });
        if (!reservation) throw new NotFoundException('Reservation not found');
        return reservation;
    }

    async findByClient(id: number): Promise<Reservation[]>{
        const reservation = await this.reservationRepository.find({
            where: { client: {id: id}},
            relations: ['room','client','payment'],
            select: ['id', 'status', 'check_in', 'check_out'],
            order: { check_in: 'ASC' }
        })
        if ( reservation.length === 0) throw new NotFoundException('No reservations found')
        return reservation
    }

    async create(data: Reservation): Promise<Reservation> {
        const [room, client] = await Promise.all([
            this.roomsRepository.findOne({ where: { id: data.room.id }, relations: ['hotel'] }),
            this.clientRepository.findOne({ where: { id: data.client.id } }),
        ]);
        
        if (!room) throw new NotFoundException('Room not found');
        if (!client) throw new NotFoundException('Client not found');
        if (new Date(data.check_in) >= new Date(data.check_out)) throw new ConflictException(' Check in must be greater than check out');
        
        const existBooking = await this.reservationRepository.findOne({
            where: {
                room: {id: data.room.id},
                check_in: Between(data.check_in, data.check_out),
                check_out: Between(data.check_in, data.check_out),
                status: Not('canceled')
            }
        })

        if (existBooking) throw new ConflictException('Reservation already exists');

        const reservation = this.reservationRepository.create({
            ...data,
            room,
            client,
        });

        return await this.reservationRepository.save(reservation);
    }

    async update(id: number, data: Partial<Reservation>): Promise<Reservation> {
        const reservation = await this.reservationRepository.preload({
            id,
            ...data,
        });

        if (!reservation) throw new NotFoundException('Reservation not found');

        if (data.room?.id) {
            const room = await this.roomsRepository.findOne({ where: { id: data.room.id }, relations: ['hotel'] });
            if (!room) throw new NotFoundException('Room not found');
            reservation.room = room;
        }

        if (data.client?.id) {
            const client = await this.clientRepository.findOne({ where: { id: data.client.id } });
            if (!client) throw new NotFoundException('Client not found');
            reservation.client = client;
        }

        const checkIn = data.check_in ?? reservation.check_in;
        const checkOut = data.check_out ?? reservation.check_out;

        if (checkIn && checkOut) {
            if (new Date(checkIn) >= new Date(checkOut)) {
                throw new ConflictException('Check in must be before check out');
            }
            const existBooking = await this.reservationRepository.findOne({
                where: {
                    id: Not(id),
                    room: {id: reservation.room.id},
                    check_in: Between(checkIn, checkOut),
                    check_out: Between(checkIn, checkOut),
                    status: Not('canceled')
                }
            })
            if (existBooking) throw new ConflictException('Reservation already exists');
        }
        return await this.reservationRepository.save(reservation);
    }

    async remove(id: number): Promise<string> {
        const reservation = await this.reservationRepository.findOne({ where: { id } });
        if (!reservation) throw new NotFoundException('Reservation not found');
        await this.reservationRepository.remove(reservation);
        return 'Reservation deleted successfully';
    }

    async bookingCanceled(id: number): Promise<Reservation>{
        const reservation = await this.reservationRepository.findOne({
            where: { id: id }, 
            relations: ['room', 'client', 'payment']
        })

        if (!reservation) throw new NotFoundException('Reservation not found');
        if (reservation.status !== 'confirmed') throw new NotFoundException('Reservation not confirmed');

        reservation.status = 'canceled'
        await this.reservationRepository.save(reservation)

        const room = await this.roomsRepository.findOne({ where: { id: reservation.room.id }, relations: ['hotel'] })
        if (room) {
            room.status = 'free'
            await this.roomsRepository.save(room)
        }
        return reservation
    }
}
