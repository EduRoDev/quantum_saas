import { Body, Controller, Delete, Get, Param, Patch, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { extname } from 'path';
import * as fs from 'fs';
import { diskStorage } from 'multer';
import { Room } from 'src/Models/rooms.models';
import { RoomsService } from 'src/Services/rooms/rooms.service';

@Controller('rooms')
export class RoomsController {
    constructor(
        private roomsService: RoomsService
    ){}

    @Get('all')
    async findAll(){
        return await this.roomsService.findAll()
    }

    @Get(':id')
    async findById(@Param('id') id: number){
        return await this.roomsService.findById(id)
    }

    @Get('name/:name')
    async findByName(@Param('name') name: string){
        return await this.roomsService.findByName(name)
    }

    @Get('status/:status')
    async findByStatus(@Param('status') status: string){
        return await this.roomsService.findByStatus(status)
    }

    @Get(':id/reservations')
    async findReservations(@Param('id') id: number){
        return await this.roomsService.findReservations(id)
    }

    @Get('rooms-by-admin/:adminId')
    async findRoomsByAdmin(@Param('adminId') adminId: number){
        return await this.roomsService.findRoomsByAdmin(adminId)
    }

    @Post('create')
    @UseInterceptors(FileInterceptor('image',{
        storage: diskStorage({
            destination: (req, file, cb) => {
                const uploadPath = './uploads/rooms';
                if (!fs.existsSync(uploadPath)) {
                    fs.mkdirSync(uploadPath, { recursive: true });
                }
                cb(null, uploadPath);
            },
            filename: (req, file, cb) => {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
                cb(null, uniqueSuffix + extname(file.originalname));
            }
        })
    }))
    async create(@Body() data: Room, @UploadedFile() file: Express.Multer.File){
        return await this.roomsService.create(data, file)
    }

    @Patch(':id')
    @UseInterceptors(FileInterceptor('image',{
        storage: diskStorage({
            destination: (req, file, cb) => {
                const uploadPath = './uploads/rooms';
                if (!fs.existsSync(uploadPath)) {
                    fs.mkdirSync(uploadPath, { recursive: true });
                }
                cb(null, uploadPath);
            },
            filename: (req, file, cb) => {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
                cb(null, uniqueSuffix + extname(file.originalname));
            }
        })
    }))
    async update(
        @Param('id') id: number, 
        @Body() data: Partial<Room>, 
        @UploadedFile() file?: Express.Multer.File){
        return await this.roomsService.update(id, data, file)
    }

    @Delete(':id')
    async remove(@Param('id') id: number){
        return await this.roomsService.remove(id)
    }
}

