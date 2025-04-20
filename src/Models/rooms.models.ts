import { Column, Entity, JoinColumn, ManyToMany, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Hotel } from "./hotels.models";
import { Reservation } from "./reservations.models";
import { PaymentReservation } from "./pago_reserva.models";

@Entity()
export class Room {
    @PrimaryGeneratedColumn()
    id: number;
    @Column()
    name: string;
    @Column()
    description: string;
    @Column()
    price: number;
    @Column({
        type: 'enum',
        enum: ['free', 'busy', 'booked'],
        default: 'free',
    })
    status: string;
    @Column()
    ability: string;
    @Column()
    image: string;

    @ManyToOne(() => Hotel, (hotel) => hotel.rooms)
    @JoinColumn({ name: "hotel_id" })
    hotel: Hotel;

    @OneToMany(() => Reservation, (reservation) => reservation.room)
    reservation: Reservation[];

    @OneToMany(() => PaymentReservation, (payment) => payment.room)
    payment: PaymentReservation[];
}