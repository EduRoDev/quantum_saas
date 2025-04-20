import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { AdminHotels } from "./admins_hotels.models";
import { Room } from "./rooms.models";

@Entity()
export class Hotel {
    @PrimaryGeneratedColumn()
    id: number;
    @Column()
    name: string;
    @Column()
    description: string;
    @Column({type: 'enum', enum: ['hotel', 'hostel', 'motel', 'arbnb', 'other']})
    type_accomodation: string;
    @Column()
    country: string;
    @Column()
    city: string;
    @Column()
    address: string;
    @Column()
    phone: string;
    @Column()
    email: string;

    @OneToMany(() => AdminHotels, (admin_hotels) => admin_hotels.hotel)
    admin_hotel: AdminHotels[];

    @OneToMany(() => Room, (room) => room.hotel)
    rooms: Room[];

}