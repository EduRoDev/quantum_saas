import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Client } from 'src/Models/clients.models';
import { Reservation } from 'src/Models/reservations.models';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { AdminHotelsService } from 'src/Services/admin-hotels/admin-hotels.service';

@Injectable()
export class ClientsService {
    constructor(
        @InjectRepository(Client)
        private clientRepository: Repository<Client>,
        private adminHotelsService: AdminHotelsService
    ){}

    async findAll(): Promise<Client[]> {
        const clients = await this.clientRepository.find()
        if ( clients.length === 0) throw new NotFoundException('No clients found')
        return clients
    }

    async findOne(id: number): Promise<Client> {
        const client = await this.clientRepository.findOne({
            where: { id },
            relations: ['reservation', 'payment']
        })
        if (!client) throw new NotFoundException('Client not found')
        return client
    }

    async findOneByName(name:string): Promise<Client> {
        const client = await this.clientRepository.findOne({
            where: { name },
            relations: ['reservation', 'payment']
        })
        if (!client) throw new NotFoundException('Client not found')
        return client
    }

    async findOneByEmail(email: string): Promise<Client> {
        const client = await this.clientRepository.findOne({
            where: { email },
            relations: ['reservation', 'payment']
        })
        if (!client) throw new NotFoundException('Client not found')
        return client
    }

    async create(data: Client): Promise<Client> {
        const exist = await this.clientRepository.findOne({
            where: [
                { email: data.email },
                { number_document: data.number_document },
            ]
        })

        if (exist) throw new ConflictException('Client already exists')

        const salt = await bcrypt.genSalt();
        data.password = await bcrypt.hash(data.password, salt);

        const client = this.clientRepository.create(data)
        return await this.clientRepository.save(client)
    }
    
    async update(id: number, data: Partial<Client>): Promise<Client> {
        const client = await this.clientRepository.preload({
            id,
            ...data
        })
        if (!client) throw new NotFoundException('Client not found')
        if(client.email || client.number_document){
            const exist = await this.clientRepository.findOne({
                where: [
                    { email: client.email ?? client.email},
                    { number_document: client.number_document ?? client.number_document},
                ]
            })
            if (exist && exist.id !== id) throw new ConflictException('Client already exists')
        }
        return await this.clientRepository.save(client)
    }

    async remove(id: number): Promise<string>{
        const result = await this.clientRepository.delete(id)
        if(!result.affected) throw new NotFoundException('Client not found')
        return 'Client deleted successfully'
    }

    async findReservations(id: number): Promise<Reservation[]>{
        const client = await this.clientRepository.findOne({
            where: { id },
            relations: ['reservation']
        })
        if (!client) throw new NotFoundException('Client not found')
        if (client.reservation.length === 0) throw new NotFoundException('No reservations found')   
        return client.reservation
    }

    async findClientsByAdmin(adminId: number): Promise<Client[]> {
        const hotels = await this.adminHotelsService.findHotelsByAdmin(adminId);
        const hotelIds = hotels.map(h => h.id);
        if (hotelIds.length === 0) throw new NotFoundException('No hotels assigned to this admin');
        return this.clientRepository.createQueryBuilder('client')
          .distinct(true)
          .innerJoin('client.reservation', 'reservation')
          .innerJoin('reservation.room', 'room')
          .innerJoin('room.hotel', 'hotel')
          .where('hotel.id IN (:...hotelIds)', { hotelIds })
          .getMany();
    }
}
