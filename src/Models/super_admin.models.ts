import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('super_admin')
export class super_admin {
    @PrimaryGeneratedColumn()
    id: number;
    @Column()
    name: string;
    @Column()
    last_name: string;
    @Column()
    email: string;
    @Column()
    password: string;
    @Column()
    phone: string;
}