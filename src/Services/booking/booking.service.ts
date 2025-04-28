import { HttpService } from '@nestjs/axios';
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { lastValueFrom } from 'rxjs';
import { Client } from 'src/Models/clients.models';
import { Reservation } from 'src/Models/reservations.models';
import { Room } from 'src/Models/rooms.models';
import { Between, DataSource, Not, Repository } from 'typeorm';

@Injectable()
export class BookingService {
    constructor(
        @InjectRepository(Reservation)
        private readonly reservationRepository: Repository<Reservation>,
        @InjectRepository(Room)
        private readonly roomsRepository: Repository<Room>,
        @InjectRepository(Client)
        private readonly clientRepository: Repository<Client>,
        private dataSource: DataSource,
        private readonly httpService: HttpService
    ) { }

    async findAll(): Promise<Reservation[]> {
        const reservations = await this.reservationRepository.find({
            relations: ['room', 'client', 'payment'],
        });
        if (reservations.length === 0) throw new NotFoundException('No reservations found');
        return reservations;
    }

    async findByHotel(id: number): Promise<Reservation[]> {
        const reservations = await this.reservationRepository.find({
            where: { room: { hotel: { id: id } } },
            relations: ['room', 'client', 'payment'],
            select: ['id', 'status', 'check_in', 'check_out'],
            order: { check_in: 'ASC' }
        });
        if (reservations.length === 0) throw new NotFoundException('No reservations found');
        return reservations;
    }

    async findOne(id: number): Promise<Reservation> {
        const reservation = await this.reservationRepository.findOne({
            where: { id },
            relations: ['room', 'room.hotel', 'client', 'payment'],
        });
        if (!reservation) throw new NotFoundException('Reservation not found');
        return reservation;
    }

    async findByClient(id: number): Promise<Reservation[]> {
        const reservation = await this.reservationRepository.find({
            where: { client: { id: id } },
            relations: ['room', 'client', 'payment'],
            select: ['id', 'status', 'check_in', 'check_out'],
            order: { check_in: 'ASC' }
        })
        if (reservation.length === 0) throw new NotFoundException('No reservations found')
        return reservation
    }

    async findByStatus(status: string): Promise<Reservation[]> {
        const reservations = await this.reservationRepository.find({
            where: { status: status },
            relations: ['room', 'client', 'payment'],
            select: ['id', 'status', 'check_in', 'check_out'],
            order: { check_in: 'ASC' }
        });
        if (reservations.length === 0) throw new NotFoundException('No reservations found');
        return reservations;
    }

    async findByStatusByHotel(status: string, hotelId: number): Promise<Reservation[]> {
        const reservations = await this.reservationRepository.find({
            where: { status: status, room: { hotel: { id: hotelId } } },
            relations: ['room', 'client', 'payment'],
            select: ['id', 'status', 'check_in', 'check_out'],
            order: { check_in: 'ASC' }
        });
        if (reservations.length === 0) throw new NotFoundException('No reservations found');
        return reservations;
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
                room: { id: data.room.id },
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
                    room: { id: reservation.room.id },
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

    async bookingCanceled(id: number): Promise<Reservation> {
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


    async getReservationInsights(hotelId: number): Promise<any[]> {
        const query = `
            WITH reservation_context AS (
    SELECT
        res.id AS reservation_id,
        COUNT(r2.id) FILTER (WHERE r2.status = 'confirmed') AS concurrent_confirmed,
        COUNT(r2.id) AS concurrent_total,
        CASE WHEN COUNT(r2.id) > 0 THEN
            COUNT(r2.id) FILTER (WHERE r2.status = 'confirmed')::FLOAT / COUNT(r2.id)
        ELSE 0 END AS concurrent_confirmation_rate,
        COUNT(r2.id) FILTER (
            WHERE r2.check_in::date = res.check_in::date
        ) AS same_day_checkins
    FROM reservation res
    JOIN room r ON res.room_id = r.id
    JOIN hotel h ON r.hotel_id = h.id
    LEFT JOIN reservation r2 ON r2.room_id IN (SELECT id FROM room WHERE hotel_id = h.id)
        AND r2.check_in <= res.check_out
        AND r2.check_out >= res.check_in
        AND r2.id != res.id 
    GROUP BY res.id
)

SELECT
    c.id AS client_id,
    FLOOR(COALESCE(EXTRACT(YEAR FROM AGE(res.created_at, c.birth_date)), 30)/10)*10 AS client_age_group,

    (SELECT COUNT(r_hist.id)
     FROM reservation r_hist
     WHERE r_hist.client_id = c.id
     AND r_hist.id != res.id 
     AND r_hist.status = 'canceled') AS client_past_cancellations_strict,

    (SELECT COUNT(r_hist.id)
     FROM reservation r_hist
     WHERE r_hist.client_id = c.id
     AND r_hist.id != res.id) AS client_total_reservations_strict,

    CASE
        WHEN (SELECT COUNT(r_hist.id) FROM reservation r_hist WHERE r_hist.client_id = c.id AND r_hist.id != res.id) > 0
        THEN (SELECT COUNT(r_hist.id) FROM reservation r_hist WHERE r_hist.client_id = c.id AND r_hist.id != res.id AND r_hist.status = 'canceled')::FLOAT /
             (SELECT COUNT(r_hist.id) FROM reservation r_hist WHERE r_hist.client_id = c.id AND r_hist.id != res.id)
        ELSE 0
    END AS client_historical_cancel_rate_strict,

    CASE
        WHEN (SELECT COUNT(r_hist.id) FROM reservation r_hist WHERE r_hist.client_id = c.id AND r_hist.id != res.id) = 0 THEN 'new'
        WHEN (SELECT COUNT(r_hist.id) FROM reservation r_hist WHERE r_hist.client_id = c.id AND r_hist.id != res.id) BETWEEN 1 AND 3 THEN 'occasional'
        WHEN (SELECT COUNT(r_hist.id) FROM reservation r_hist WHERE r_hist.client_id = c.id AND r_hist.id != res.id) BETWEEN 4 AND 10 THEN 'regular'
        ELSE 'frequent'
    END AS client_type,

    (SELECT AVG(rm_avg.price)
     FROM room rm_avg
     WHERE rm_avg.hotel_id = h.id) AS hotel_avg_room_price_for_profile,

    CASE
        WHEN (SELECT PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY rm_hist.price)
              FROM reservation r_hist
              JOIN room rm_hist ON r_hist.room_id = rm_hist.id
              WHERE r_hist.client_id = c.id AND r_hist.id != res.id) < (SELECT AVG(rm_avg.price) FROM room rm_avg WHERE rm_avg.hotel_id = h.id) THEN 'below_avg'
        WHEN (SELECT PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY rm_hist.price)
              FROM reservation r_hist
              JOIN room rm_hist ON r_hist.room_id = rm_hist.id
              WHERE r_hist.client_id = c.id AND r_hist.id != res.id) < (SELECT AVG(rm_avg.price) FROM room rm_avg WHERE rm_avg.hotel_id = h.id) * 1.3 THEN 'avg'
        ELSE 'above_avg'
    END AS client_spending_profile, 

    (SELECT COUNT(DISTINCT res_hist.id)
     FROM reservation res_hist
     JOIN room rm_hist ON res_hist.room_id = rm_hist.id
     WHERE rm_hist.hotel_id = h.id
     AND res_hist.id != res.id 
     AND res_hist.status IN ('canceled', 'refunded')) AS hotel_canceled_strict,

    (SELECT COUNT(DISTINCT res_hist.id)
     FROM reservation res_hist
     JOIN room rm_hist ON res_hist.room_id = rm_hist.id
     WHERE rm_hist.hotel_id = h.id
     AND res_hist.id != res.id) AS hotel_total_reservations_strict,

    CASE
        WHEN (SELECT COUNT(DISTINCT res_hist.id) FROM reservation res_hist JOIN room rm_hist ON res_hist.room_id = rm_hist.id WHERE rm_hist.hotel_id = h.id AND res_hist.id != res.id) > 0
        THEN (SELECT COUNT(DISTINCT res_hist.id) FROM reservation res_hist JOIN room rm_hist ON res_hist.room_id = rm_hist.id WHERE rm_hist.hotel_id = h.id AND res_hist.id != res.id AND res_hist.status IN ('canceled', 'refunded'))::FLOAT /
             (SELECT COUNT(DISTINCT res_hist.id) FROM reservation res_hist JOIN room rm_hist ON res_hist.room_id = rm_hist.id WHERE rm_hist.hotel_id = h.id AND res_hist.id != res.id)
        ELSE 0
    END AS hotel_cancellation_rate_strict,

    CASE
        WHEN (SELECT COUNT(DISTINCT res_hist.id) FROM reservation res_hist JOIN room rm_hist ON res_hist.room_id = rm_hist.id WHERE rm_hist.hotel_id = h.id AND res_hist.id != res.id) < 10 THEN 'low_volume'
        WHEN (SELECT COUNT(DISTINCT res_hist.id) FROM reservation res_hist JOIN room rm_hist ON res_hist.room_id = rm_hist.id WHERE rm_hist.hotel_id = h.id AND res_hist.id != res.id) < 50 THEN 'medium_volume'
        ELSE 'high_volume'
    END AS hotel_volume_category,

    rm.price AS room_price,
    
    rm.price / NULLIF((SELECT AVG(rm_avg.price) FROM room rm_avg WHERE rm_avg.hotel_id = h.id), 0) AS price_ratio_to_avg,
    rm.price * GREATEST(DATE_PART('day', res.check_out::timestamp - res.check_in::timestamp), 1) AS total_booking_value,
    GREATEST(DATE_PART('day', res.check_out::timestamp - res.check_in::timestamp), 1) AS stay_duration,
    
    CASE
        WHEN DATE_PART('day', res.check_in::timestamp - res.created_at::timestamp) < 3 THEN '0-3_days'
        WHEN DATE_PART('day', res.check_in::timestamp - res.created_at::timestamp) < 7 THEN '3-7_days'
        WHEN DATE_PART('day', res.check_in::timestamp - res.created_at::timestamp) < 30 THEN '7-30_days'
        ELSE '30+_days'
    END AS booking_lead_time,
    
    CASE WHEN EXTRACT(MONTH FROM res.check_in) IN (6,7,8,12) THEN 1 ELSE 0 END AS is_peak_season,

    rc.concurrent_confirmation_rate,
    rc.same_day_checkins,
    
    CASE
        WHEN rc.concurrent_total = 0 THEN 'none'
        WHEN rc.concurrent_total < 5 THEN 'low'
        WHEN rc.concurrent_total < 15 THEN 'medium'
        ELSE 'high'
    END AS concurrent_demand_level,

    CASE
        WHEN pr.amount IS NULL THEN 'no_payment'
        WHEN pr.amount = 0 THEN 'zero_payment'
        WHEN pr.amount < rm.price * 0.5 THEN 'deposit_only' 
        WHEN pr.amount < rm.price * GREATEST(DATE_PART('day', res.check_out::timestamp - res.check_in::timestamp), 1) THEN 'partial_payment' 
        ELSE 'full_payment'
    END AS payment_completeness,

    CASE
        WHEN res.status IN ('canceled', 'refunded') THEN 1
        ELSE 0
    END AS is_canceled

FROM reservation res
JOIN client c ON res.client_id = c.id AND c.rol = 'user'
JOIN room rm ON res.room_id = rm.id
JOIN hotel h ON rm.hotel_id = h.id
LEFT JOIN payment_reservation pr ON pr.reservation_id = res.id
LEFT JOIN reservation_context rc ON res.id = rc.reservation_id 

WHERE res.check_in IS NOT NULL
AND res.check_out IS NOT NULL
AND res.check_out >= res.check_in
AND res.created_at <= res.check_in
            AND h.id = $1;
            `;

        const result = await this.dataSource.query(query, [hotelId]);
        const serviceSpring = 'http://localhost:8080/api/prediccion/predict'
        const response = await lastValueFrom(this.httpService.post(serviceSpring, result))
        return response.data;
    }
}

