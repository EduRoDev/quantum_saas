import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AdminHotels } from 'src/Models/admins_hotels.models';
import { Hotel } from 'src/Models/hotels.models';
import { Room } from 'src/Models/rooms.models';
import { Repository } from 'typeorm';

@Injectable()
export class RoomsService {
    constructor(
        @InjectRepository(Room)
        private roomsRepository: Repository<Room>,
        @InjectRepository(Hotel)
        private hotelsRepository: Repository<Hotel>,
        @InjectRepository(AdminHotels)
        private adminHotelRepository: Repository<AdminHotels>
    ){}

    async findAll(): Promise<Room[]> {
        const rooms = await this.roomsRepository.find({
            relations: ['hotel', 'reservation']
        })
        if ( rooms.length === 0) throw new NotFoundException('No rooms found')
        return rooms
    }

    async findById(id: number): Promise<Room> {
        const room = await this.roomsRepository.findOne({
            where: { id },
            relations: ['hotel', 'reservation']
        })
        if (!room) throw new NotFoundException('Room not found')
        return room
    }

    async findRoomsByAdmin(adminId: number): Promise<Room[]> {
        const adminHotels = await this.adminHotelRepository.find({
            where: { user: {id: adminId} },
            relations: ['hotel', 'hotel.rooms']
        })
        if (adminHotels.length === 0) throw new NotFoundException('No hotels found for this admin')
        const rooms = adminHotels.flatMap(adminHotel => adminHotel.hotel.rooms)
        if (rooms.length === 0) throw new NotFoundException('No rooms found for this admin')
        return rooms
    }

    async findByName(name: string): Promise<Room> {
        const room = await this.roomsRepository.findOne(
            { where: { name },
            relations: ['hotel', 'reservation'] 
        })
        if (!room) throw new NotFoundException('Room not found')
        return room
    }

    async create(data: Room): Promise<Room> {
        const hotel = await this.hotelsRepository.findOne({
            where: { id: data.hotel.id }
        })
        if (!hotel) throw new NotFoundException('Hotel not found')
        const room = this.roomsRepository.create({ ...data, hotel})
        return await this.roomsRepository.save(room)
    }

    async update(id: number, data: Partial<Room>): Promise<Room> {
        const existingRoom = await this.roomsRepository.findOne({ where: { id } });
    
        if (!existingRoom) throw new NotFoundException('Room not found');
    
        const room = this.roomsRepository.merge(existingRoom, data);
    
        if (data.hotel?.id) {
            const hotel = await this.hotelsRepository.findOne({
                where: { id: data.hotel.id }
            });
            if (!hotel) throw new NotFoundException('Hotel not found');
            room.hotel = hotel;
        }
    
        return await this.roomsRepository.save(room);
    }
    

    async remove(id: number): Promise<string> {
        const room = await this.roomsRepository.findOne({ where: { id } })
        if (!room) throw new NotFoundException('Room not found')
        await this.roomsRepository.remove(room)
        return 'Room deleted successfully'
    }

    async findReservations(id: number){
        const room = await this.roomsRepository.findOne({
            where: { id },
            relations: ['reservation']
        })
        if (!room) throw new NotFoundException('Room not found')
        if (room.reservation.length === 0) throw new NotFoundException('No reservations found')
        return room.reservation
    }
}
