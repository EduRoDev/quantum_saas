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

    async findAllWithImage(): Promise<Room[]> {
        const rooms = await this.roomsRepository.find({
            relations: ['hotel', 'reservation']
        });

        if (rooms.length === 0) throw new NotFoundException('No rooms found');

        return rooms.map(room => {
            if (room.image) {
                const baseUrl = 'http://localhost:3000';
                const normalizedPath = room.image.replace(/\\/g, '/');
                if (!normalizedPath.startsWith(baseUrl)) {
                    room.image = `${baseUrl}/${normalizedPath}`;
                } else {
                    room.image = normalizedPath;
                }
            } else {
                room.image = 'No tiene imagen';
            }
            return room;
        });
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
        return rooms.map(room => {
            if (room.image) {
                const baseUrl = 'http://localhost:3000';
                const normalizedPath = room.image.replace(/\\/g, '/');
                if (!normalizedPath.startsWith(baseUrl)) {
                    room.image = `${baseUrl}/${normalizedPath}`;
                } else {
                    room.image = normalizedPath;
                }
            } else {
                room.image = 'No tiene imagen';
            }
            return room;
        });
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
        // Validar que se haya enviado el id del hotel
        const hotelId = (data as any).hotelId || data.hotel?.id; // Asegúrate de manejar ambos casos
        if (!hotelId) {
            throw new NotFoundException('Hotel ID is required');
        }

        // Buscar el hotel en la base de datos
        const hotel = await this.hotelsRepository.findOne({
            where: { id: hotelId },
        });
        if (!hotel) {
            throw new NotFoundException('Hotel not found');
        }

        // Manejar la imagen
        let imagePath: string | undefined;
        if (file) {
            imagePath = file.path;
        }

        // Crear la habitación
        const room = this.roomsRepository.create({
            ...data,
            hotel, // Asocia el hotel encontrado
            image: imagePath,
        });

        // Guardar la habitación en la base de datos
        return await this.roomsRepository.save(room);
    }

    async update(id: number, data: Partial<Room>, file?: Express.Multer.File): Promise<Room> {
        const existingRoom = await this.roomsRepository.findOne({ where: { id } });
    
        if (!existingRoom) throw new NotFoundException('Room not found');
    
        // Si hay un archivo nuevo
        if (file) {
            // Eliminar la imagen anterior si existe
            if (existingRoom.image) {
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
            // Guardar la nueva imagen
            data.image = file.path;
        } else if ((data as any).currentImage) {
            // Si no hay archivo nuevo pero hay una imagen actual, mantenerla
            data.image = (data as any).currentImage;
            delete (data as any).currentImage;
        }
    
        const room = this.roomsRepository.merge(existingRoom, data);
    
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
