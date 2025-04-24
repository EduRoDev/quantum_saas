import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { ClientsService } from '../Services/clients/clients.service';
import { UsersService } from '../Services/users/users.service';
import { JwtStrategy } from './auth.strategy';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Client } from '../Models/clients.models';
import { User } from '../Models/users.models';
import { AdminHotels } from '../Models/admins_hotels.models';
import { Hotel } from '../Models/hotels.models';
import { AdminHotelsService } from '../Services/admin-hotels/admin-hotels.service';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: 'yourSecretKey',
      signOptions: { expiresIn: '1h' },
    }),
    TypeOrmModule.forFeature([Client, User, AdminHotels, Hotel]),
  ],
  providers: [AuthService, JwtStrategy, ClientsService, UsersService, AdminHotelsService],
  controllers: [AuthController],
  exports: [JwtModule],
})
export class AuthModule {}
