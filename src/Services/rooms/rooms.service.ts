import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as fs from 'fs';
import * as path from 'path';
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
        if( room.image){
            const baseUrl = 'http://localhost:3000'; 
            const normalizedPath = room.image.replace(/\\/g, '/'); 
            if (!normalizedPath.startsWith(baseUrl)) {
                room.image = `${baseUrl}/${normalizedPath}`;
            } else {
                room.image = normalizedPath; 
            }
        }
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
            { where: { name }
        })
        if (!room) throw new NotFoundException('Room not found')
        return room
    }

    async findByStatus(status: string): Promise<Room[]> {
        const room = await this.roomsRepository.find(
            { where: { status }
        })
        if (!room) throw new NotFoundException('Room not found')
        return room
    }

    async create(data: Partial<Room>, file: Express.Multer.File): Promise<Room> {
        const hotel = await this.hotelsRepository.findOne({
            where: { id: data.hotel?.id }
        });
        if (!hotel) throw new NotFoundException('Hotel not found');
    
        
        let imagePath: string | undefined;
        if (file) {
            imagePath = file.path; 
        }
        const room = this.roomsRepository.create({
            ...data,
            hotel,
            image: imagePath 
        });
        return await this.roomsRepository.save(room);
    }

    async update(id: number, data: Partial<Room>, file?: Express.Multer.File): Promise<Room> {
        const existingRoom = await this.roomsRepository.findOne({ where: { id } });
    
        if (!existingRoom) throw new NotFoundException('Room not found');
    
        // Depuración: Verificar si el archivo se recibe
        if (file) {
            console.log('Archivo recibido:', file);
        } else {
            console.log('No se recibió ningún archivo');
        }
    
        // Eliminar la imagen anterior si se sube una nueva
        if (file && existingRoom.image) {
            const oldImagePath = path.join(__dirname, '..', '..', '..', existingRoom.image);
            try {
                if (fs.existsSync(oldImagePath)) {
                    fs.unlinkSync(oldImagePath);
                    console.log('Imagen anterior eliminada:', oldImagePath);
                }
            } catch (error) {
                console.error('Error al eliminar la imagen anterior:', error);
            }
        }
    
        const room = this.roomsRepository.merge(existingRoom, data);
    
        // Guardar la nueva imagen si se proporciona
        if (file) {
            room.image = file.path;
            console.log('Nueva imagen guardada:', room.image);
        }
    
        // Actualizar la relación con el hotel si se proporciona
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
