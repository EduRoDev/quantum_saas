import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Hotel } from 'src/Models/hotels.models';
import { Repository } from 'typeorm';

@Injectable()
export class HotelsService {
    constructor(
        @InjectRepository(Hotel)
        private hotelsRepository: Repository<Hotel>
    ){}

    async findAll(): Promise<Hotel[]> {
        const result = await this.hotelsRepository.find();
        if (result.length === 0) {
            throw new NotFoundException('No hotels found');
        }
        return result;
    }

    async findOne(id: number): Promise<Hotel>{
        const result = await this.hotelsRepository.findOne({where: { id }});
        if (!result) throw new NotFoundException('Hotel not found');
        return result;
    }

    async create(hotel: Hotel): Promise<Hotel> {
        const newHotel = this.hotelsRepository.save(hotel);
        return newHotel;
    }

    async update(id: number, dataHotel: Partial<Hotel>): Promise<Hotel>{
        const hotelExist = await this.hotelsRepository.findOne({where: {id}})
        if (!hotelExist) throw new NotFoundException('Hotel not found');
        const updateHotel = this.hotelsRepository.merge(hotelExist, dataHotel);
        return await this.hotelsRepository.save(updateHotel);
    }

    async remove(id: number): Promise<string> {
        const result = await this.hotelsRepository.delete(id);
        if (result.affected === 0) throw new NotFoundException('Hotel not found');
        return 'Hotel deleted successfully';
    }
}
