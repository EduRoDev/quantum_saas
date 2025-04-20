import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Room } from "./rooms.models";
import { Client } from "./clients.models";
import { PaymentReservation } from "./pago_reserva.models";

@Entity()
export class Reservation {
    @PrimaryGeneratedColumn()
    id: number;
    @ManyToOne(() => Room, (room) => room.reservation)
    @JoinColumn({ name: "room_id" })
    room: Room;

    @ManyToOne(() => Client, (client) => client.reservation)
    @JoinColumn({ name: "client_id" })
    client: Client;

    @Column({
        type: 'enum',
        enum: ['canceled', 'confirmed', 'refunded'],
    })
    status: string;

    @Column({ type: 'date', nullable: true })
    check_in: Date;

    @Column({ type: 'date', nullable: true })
    check_out: Date;

    @OneToMany(() => PaymentReservation, (payment) => payment.reservation)
    payment: PaymentReservation[];
}