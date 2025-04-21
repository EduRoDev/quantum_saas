import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/Models/users.models';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private usersRepository: Repository<User>,
    ){}

    async findAll(): Promise<User[]> {
        const result = await this.usersRepository.find();
        if (result.length === 0) {
            throw new NotFoundException('No users found');
        }
        return result;
    }

    async findOne(id: number): Promise<User>{
        const result = await this.usersRepository.findOne({where: { id } })
        if (!result) throw new NotFoundException('User not found');
        return result;
    }

    async findOneByEmail(email: string): Promise<User>{
        const result = await this.usersRepository.findOne({
            where: { email },
            relations: ['payments']
        });
        if (!result) throw new NotFoundException('User not found');
        return result;
    }
    
    async create(user: User): Promise<User> {
        const salt = await bcrypt.genSalt();
        user.password = await bcrypt.hash(user.password, salt);

        const newUser = this.usersRepository.save(user);
        return newUser;
    }

    async update(id: number, dataUser: Partial<User>): Promise<User>{
        const userExist = await this.usersRepository.findOne({where: {id}})
        if (!userExist) throw new NotFoundException('User not found');
        const updateUser = this.usersRepository.merge(userExist, dataUser);
        return await this.usersRepository.save(updateUser);
    }

    async remove(id: number): Promise<string> {
        const result = await this.usersRepository.delete(id);
        if (result.affected === 0) throw new NotFoundException('User not found');
        return 'User deleted successfully';
    }
}
