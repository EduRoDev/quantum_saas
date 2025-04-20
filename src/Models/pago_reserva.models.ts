import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Reservation } from "./reservations.models";
import { Client } from "./clients.models";
import { Room } from "./rooms.models";

@Entity()
export class PaymentReservation {
    @PrimaryGeneratedColumn()
    id: number;
    @Column({
        type: 'timestamp',
        default: () => 'CURRENT_TIMESTAMP',
        nullable: false,
    })
    payment_date: Date;
    @Column({
        type: 'enum',
        enum: ['pending', 'canceled', 'confirmed','refunded'],
        default: 'pending',
    })
    status: string;
    @Column({
        type:'decimal',
        precision: 10,
        scale: 2,
    })
    amount: number;
    @Column({
        type: 'enum',
        enum: ['visa', 'mastercard', 'paypal', 'other'],
        default: 'other',
    })
    payment_method: string;

    @ManyToOne(() => Reservation, (reservation) => reservation.payment)
    @JoinColumn({ name: "reservation_id" })
    reservation: Reservation;

    @ManyToOne(() => Client, (client) => client.payment)
    @JoinColumn({ name: "client_id" })
    client: Client;

    @ManyToOne(() => Room, (room) => room.payment)
    @JoinColumn({ name: "room_id" })
    room: Room;
}