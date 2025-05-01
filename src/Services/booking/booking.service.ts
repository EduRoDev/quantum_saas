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

    async findBookingClient(id: number, clientId: number): Promise<Reservation>{
        const reservation = await this.reservationRepository.findOne({
            where: { id: id,
                client: { id: clientId } },
            relations: ['room', 'client', 'payment'],
            select: ['id', 'status', 'check_in', 'check_out'],
            order: { check_in: 'ASC' }
        })
        if (!reservation) throw new NotFoundException('No reservations found')
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
                WITH
hotel_base_info AS (
    -- Calcula estadísticas base para el hotel específico
    SELECT
        h.id AS hotel_id,
        AVG(rm.price) AS avg_room_price_hotel,
        COUNT(res_hist.id) AS total_reservations_hotel_overall,
        COUNT(res_hist.id) FILTER (WHERE res_hist.status IN ('canceled', 'refunded')) AS canceled_reservations_hotel_overall
    FROM hotel h
    JOIN room rm ON h.id = rm.hotel_id
    LEFT JOIN reservation res_hist ON rm.id = res_hist.room_id
    WHERE h.id = $1  -- <<< FILTRO DE HOTEL ACTIVADO
    GROUP BY h.id -- Mantenemos el GROUP BY para obtener stats por hotel
),

reservation_client_history AS (
    -- Obtiene historial de cliente para reservas del hotel específico
    SELECT
        res.id AS reservation_id,
        res.client_id,
        res.room_id,
        res.check_in,
        res.check_out,
        res.created_at,
        res.status,
        rm.hotel_id, -- Necesitamos el hotel_id para unir con hotel_base_info
        rm.price AS room_price, -- Mantenemos el tipo original aquí, cast al final si es necesario
        c.birth_date,
        c.rol,
        -- Historial del cliente ANTES de ESTA reserva (calculado sobre todas las reservas del cliente EN CUALQUIER HOTEL)
        -- Nota: El historial del cliente sigue siendo global para entender al cliente en general
        COUNT(res_prior.id) OVER w_client_hist AS client_total_reservations_strict,
        COUNT(res_prior.id) FILTER (WHERE res_prior.status = 'canceled') OVER w_client_hist AS client_past_cancellations_strict,
        AVG(rm_prior.price) OVER w_client_hist AS client_avg_historical_price -- Mantenemos el tipo original aquí
    FROM reservation res
    JOIN room rm ON res.room_id = rm.id
    JOIN client c ON res.client_id = c.id
    -- Subquery o JOIN para obtener historial previo del cliente
    LEFT JOIN (
        SELECT
            res_p.id, res_p.client_id, res_p.created_at, res_p.status, rm_p.price
        FROM reservation res_p
        JOIN room rm_p ON res_p.room_id = rm_p.id
    ) res_prior ON res.client_id = res_prior.client_id AND res_prior.created_at < res.created_at
    LEFT JOIN room rm_prior ON res_prior.id = rm_prior.id -- Unimos para obtener el precio de las reservas anteriores
    WHERE rm.hotel_id = $1 -- <<< FILTRO DE HOTEL ACTIVADO para las reservas actuales
      AND c.rol = 'user' -- Mantenemos filtro de rol de cliente
      AND res.check_in IS NOT NULL
      AND res.check_out IS NOT NULL
      AND res.check_out > res.check_in
      AND res.created_at <= res.check_in
    WINDOW w_client_hist AS (PARTITION BY res.client_id ORDER BY res.created_at ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING) -- Esta ventana es correcta para el historial *antes* de la reserva actual.
),

reservation_context_calc AS (
    -- Calcula concurrencia para reservas del hotel específico
    SELECT
        res.id AS reservation_id,
        COUNT(r2.id) FILTER (WHERE r2.status = 'confirmed') AS concurrent_confirmed,
        COUNT(r2.id) AS concurrent_total,
        COUNT(r2.id) FILTER (
            WHERE r2.check_in::date = res.check_in::date
        ) AS same_day_checkins
    FROM reservation res
    JOIN room r_res ON res.room_id = r_res.id -- Necesitamos hotel_id de la reserva base 'res'
    -- Join para encontrar reservas concurrentes EN EL MISMO HOTEL
    LEFT JOIN reservation r2
        JOIN room r_r2 ON r2.room_id = r_r2.id
        ON r_r2.hotel_id = r_res.hotel_id -- Asegura mismo hotel
        AND r2.id != res.id
        AND r2.check_in <= res.check_out
        AND r2.check_out >= res.check_in
    WHERE r_res.hotel_id = $1 -- <<< FILTRO DE HOTEL ACTIVADO
      AND res.check_in IS NOT NULL
      AND res.check_out IS NOT NULL
      AND res.check_out > res.check_in
      AND res.created_at <= res.check_in
    GROUP BY res.id, res.check_in::date -- Mantenemos Group By
)

-- ========= SECCIÓN FINAL CON CASTS EXPLÍCITOS =========
SELECT
    -- Identificadores
    rch.reservation_id,
    rch.client_id,
    rch.hotel_id,

    -- Métricas del Cliente
    -- Aplicamos CAST a INTEGER aquí
    (FLOOR(COALESCE(EXTRACT(YEAR FROM AGE(rch.created_at, rch.birth_date)), 30)/10)*10)::INTEGER AS client_age_group,
    COALESCE(rch.client_past_cancellations_strict, 0)::INTEGER AS client_past_cancellations_strict,
    COALESCE(rch.client_total_reservations_strict, 0)::INTEGER AS client_total_reservations_strict,
    (CASE
        WHEN COALESCE(rch.client_total_reservations_strict, 0) > 0
            THEN (COALESCE(rch.client_past_cancellations_strict, 0)::FLOAT / rch.client_total_reservations_strict)
        ELSE 0
    END)::DOUBLE PRECISION AS client_historical_cancel_rate_strict,
    CASE
        WHEN COALESCE(rch.client_total_reservations_strict, 0) = 0 THEN 'new'
        WHEN COALESCE(rch.client_total_reservations_strict, 0) BETWEEN 1 AND 3 THEN 'occasional'
        WHEN COALESCE(rch.client_total_reservations_strict, 0) BETWEEN 4 AND 10 THEN 'regular'
        ELSE 'regular'
    END AS client_type,
    COALESCE(hbi.avg_room_price_hotel, 0)::DOUBLE PRECISION AS hotel_avg_room_price_for_profile,
    CASE
        WHEN COALESCE(rch.client_total_reservations_strict, 0) = 0 THEN 'new_client'
        WHEN rch.client_avg_historical_price IS NULL THEN 'new_client' -- Manejar NULL si no hay historial
        WHEN rch.client_avg_historical_price < COALESCE(hbi.avg_room_price_hotel, 0)::DOUBLE PRECISION THEN 'below_avg'
        WHEN rch.client_avg_historical_price < COALESCE(hbi.avg_room_price_hotel, 0)::DOUBLE PRECISION * 1.3 THEN 'avg'
        ELSE 'above_avg'
    END AS client_spending_profile,

    -- Métricas del Hotel (Ahora específicas del hotel $1)
    COALESCE(hbi.canceled_reservations_hotel_overall, 0)::INTEGER AS hotel_canceled_strict,
    COALESCE(hbi.total_reservations_hotel_overall, 0)::INTEGER AS hotel_total_reservations_strict,
    (CASE
        WHEN COALESCE(hbi.total_reservations_hotel_overall, 0) > 0
            THEN (COALESCE(hbi.canceled_reservations_hotel_overall, 0)::FLOAT / hbi.total_reservations_hotel_overall)
        ELSE 0
    END)::DOUBLE PRECISION AS hotel_cancellation_rate_strict,
    CASE
        WHEN COALESCE(hbi.total_reservations_hotel_overall, 0) < 10 THEN 'low_volume'
        WHEN COALESCE(hbi.total_reservations_hotel_overall, 0) < 50 THEN 'medium_volume'
        ELSE 'medium_volume'
    END AS hotel_volume_category,

    -- Métricas de la Reserva/Habitación
    rch.room_price::DOUBLE PRECISION AS room_price,
    -- Asegura división por cero si avg_room_price_hotel es 0 o NULL
    (CASE
        WHEN COALESCE(hbi.avg_room_price_hotel, 0)::DOUBLE PRECISION = 0 THEN NULL -- O algún valor por defecto apropiado
        ELSE (rch.room_price::DOUBLE PRECISION / hbi.avg_room_price_hotel::DOUBLE PRECISION)
    END)::DOUBLE PRECISION AS price_ratio_to_avg,
    DATE_PART('day', rch.check_out::timestamp - rch.check_in::timestamp)::INTEGER AS stay_duration,
    (rch.room_price::DOUBLE PRECISION * DATE_PART('day', rch.check_out::timestamp - rch.check_in::timestamp))::DOUBLE PRECISION AS total_booking_value,
    CASE
        WHEN DATE_PART('day', rch.check_in::timestamp - rch.created_at::timestamp) < 3 THEN '0-3_days'
        WHEN DATE_PART('day', rch.check_in::timestamp - rch.created_at::timestamp) < 7 THEN '3-7_days'
        WHEN DATE_PART('day', rch.check_in::timestamp - rch.created_at::timestamp) < 30 THEN '7-30_days'
        ELSE '30+_days'
    END AS booking_lead_time,
    CASE WHEN EXTRACT(MONTH FROM rch.check_in) IN (6,7,8,12) THEN 1 ELSE 0 END AS is_peak_season,

    -- Métricas de Contexto/Concurrencia (Ahora específicas del hotel $1)
    COALESCE(rcc.concurrent_total, 0)::INTEGER AS concurrent_total,
    COALESCE(rcc.concurrent_confirmed, 0)::INTEGER AS concurrent_confirmed,
    (CASE WHEN COALESCE(rcc.concurrent_total, 0) > 0 THEN
        (COALESCE(rcc.concurrent_confirmed, 0)::FLOAT / rcc.concurrent_total)
    ELSE 0 END)::DOUBLE PRECISION AS concurrent_confirmation_rate,
    COALESCE(rcc.same_day_checkins, 0)::INTEGER AS same_day_checkins,
    CASE
        WHEN COALESCE(rcc.concurrent_total, 0) = 0 THEN 'none'
        WHEN COALESCE(rcc.concurrent_total, 0) < 5 THEN 'low'
        WHEN COALESCE(rcc.concurrent_total, 0) < 15 THEN 'medium'
        ELSE 'high'
    END AS concurrent_demand_level,

    -- Pago (Asumiendo que payment_reservation no necesita filtro de hotel directo, ya que se une por reservation_id que ya está filtrado)
     CASE
       WHEN pr.amount IS NULL THEN 'deposit_only'
       WHEN pr.amount = 0 THEN 'deposit_only'
       -- Asegura comparación con DOUBLE PRECISION
       WHEN pr.amount < rch.room_price::DOUBLE PRECISION * 0.5 THEN 'deposit_only'
       -- Cálculo del valor total de la reserva para comparación
       WHEN pr.amount < (rch.room_price::DOUBLE PRECISION * GREATEST(1, DATE_PART('day', rch.check_out::timestamp - rch.check_in::timestamp))) THEN 'partial_payment'
       ELSE 'full_payment'
    END AS payment_completeness,

    -- Variable Objetivo
    CASE
        WHEN rch.status IN ('canceled', 'refunded') THEN 1
        ELSE 0
    END AS is_canceled

FROM reservation_client_history rch
-- Une cada reserva con las estadísticas base de SU hotel específico (ya filtrado en el CTE)
JOIN hotel_base_info hbi ON rch.hotel_id = hbi.hotel_id
-- Une cada reserva con SU contexto de concurrencia específico (ya filtrado en el CTE)
LEFT JOIN reservation_context_calc rcc ON rch.reservation_id = rcc.reservation_id
LEFT JOIN payment_reservation pr ON pr.reservation_id = rch.reservation_id;
        `;

        const result = await this.dataSource.query(query, [hotelId]);
        const response = await lastValueFrom(this.httpService.post('http://localhost:8080/api/prediccion/predict', result));
        return response.data;
        
    }
}

