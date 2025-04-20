import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { User } from 'src/Models/users.models';
import { UsersService } from 'src/Services/users/users.service';


@Controller('users')
export class UsersController {
    constructor(
        private usersService: UsersService,
    ){}

    @Get('all')
    async findAll(): Promise<User[]>{
        return await this.usersService.findAll();
    }

    @Get(':id')
    async findOne(@Param('id') id: number): Promise<User>{
        return await this.usersService.findOne(id);
    }

    @Post('create')
    async create(@Body() newUser: User): Promise<User>{
        return await this.usersService.create(newUser);
    }

    @Patch(':id')
    async update(@Param('id') id: number, @Body() dataUser: Partial<User>): Promise<User>{
        return await this.usersService.update(id, dataUser);
    }

    @Delete(':id')
    async remove(@Param('id') id: number): Promise<string>{
        return await this.usersService.remove(id);
    }
}
