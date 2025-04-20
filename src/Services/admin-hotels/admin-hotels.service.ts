import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AdminHotels } from 'src/Models/admins_hotels.models';
import { Hotel } from 'src/Models/hotels.models';
import { User } from 'src/Models/users.models';
import { Repository } from 'typeorm';

@Injectable()
export class AdminHotelsService {
    constructor(
        @InjectRepository(AdminHotels)
        private adminHotelsRepository: Repository<AdminHotels>,
        @InjectRepository(Hotel)
        private hotelsRepository: Repository<Hotel>,
        @InjectRepository(User)
        private usersRepository: Repository<User>
    ){}

    async findHotelsByAdmin(userId: number): Promise<Hotel[]>{
        const relations = await this.adminHotelsRepository.find({
            where: { user: {id: userId} },
            relations: ['hotel']
        });
        return relations.map(relation => relation.hotel);
    }

    async findAdminsByHotel(hotelId:number): Promise<User[]>{
        const relations = await this.adminHotelsRepository.find({
            where: { hotel: {id: hotelId} },
            relations: ['user']
        });
        return relations.map(relation => relation.user);
    }
    
    async create(data: AdminHotels): Promise<AdminHotels> {
        const user = await this.usersRepository.findOne({
            where: { id: data.user.id },
        })
        if (!user) throw new Error('User not found');
        const hotel = await this.hotelsRepository.findOne({
            where: { id: data.hotel.id },
        })
        if (!hotel) throw new Error('Hotel not found');
        const newAdminHotels = this.adminHotelsRepository.save(data);
        return newAdminHotels;
    }

    async delete(id: number): Promise<string> {
        const result = await this.adminHotelsRepository.delete(id);
        if (result.affected === 0) throw new Error('Admin hotel not found');
        return 'Admin hotel deleted successfully';
    }
}
