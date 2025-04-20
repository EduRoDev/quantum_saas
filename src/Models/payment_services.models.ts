import { Column, Entity, ManyToMany, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "./users.models";

@Entity('payment_services')
export class Payment {
    @PrimaryGeneratedColumn()
    id: number;
    @Column({ type: 'enum', enum: ['PREMIUN', 'VIP']})
    name: string;
    @Column()
    description: string;
    @Column({ type: 'decimal', precision: 10, scale: 2 })
    price: number;
    @Column({type: 'boolean', default: false})
    active: boolean;
    @Column()
    created_at: Date;   
    @Column()
    updated_at: Date;

    @ManyToOne(() => User, (user) => user.payments)
    user: User
}