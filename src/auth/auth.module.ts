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

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: 'yourSecretKey',
      signOptions: { expiresIn: '1h' },
    }),
    TypeOrmModule.forFeature([Client, User]),
  ],
  providers: [AuthService, JwtStrategy, ClientsService, UsersService],
  controllers: [AuthController],
  exports: [JwtModule],
})
export class AuthModule {}
