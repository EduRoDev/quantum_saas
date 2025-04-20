import { Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Hotel } from "./hotels.models";
import { User } from "./users.models";

@Entity()
export class AdminHotels {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => User, (user) => user.admin_hotel)
    @JoinColumn({ name: "user_id" })
    user: User;

    @ManyToOne(() => Hotel, (hotel) => hotel.admin_hotel)
    @JoinColumn({ name: "hotel_id" })
    hotel: Hotel;
}