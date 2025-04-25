import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './Controllers/users/users.controller';
import { ClientsController } from './Controllers/clients/clients.controller';
import { UsersService } from './Services/users/users.service';
import { ClientsService } from './Services/clients/clients.service';
import { HotelsService } from './Services/hotels/hotels.service';
import { HotelsController } from './Controllers/hotels/hotels.controller';
import { AdminHotelsService } from './Services/admin-hotels/admin-hotels.service';
import { AdminHotelsController } from './Controllers/admin-hotels/admin-hotels.controller';
import { RoomsService } from './Services/rooms/rooms.service';
import { RoomsController } from './Controllers/rooms/rooms.controller';
import { BookingService } from './Services/booking/booking.service';
import { PaymentBookingService } from './Services/payment-booking/payment-booking.service';
import { PaymentBookingController } from './Controllers/payment-booking/payment-booking.controller';
import { User } from 'src/Models/users.models';
import { Client } from 'src/Models/clients.models';
import { Hotel } from 'src/Models/hotels.models';
import { Room } from 'src/Models/rooms.models';
import { AdminHotels } from 'src/Models/admins_hotels.models';
import { Reservation } from 'src/Models/reservations.models';
import { PaymentReservation } from 'src/Models/pago_reserva.models';
import { BookingController } from './Controllers/booking/booking.controller';
import { PaymentService } from './Services/payment/payment.service';
import { PaymentController } from './Controllers/payment/payment.controller';
import { Payment } from './Models/payment_services.models';
import { AuthModule } from './auth/auth.module';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: '123456',
      database: 'quantum_saas',
      entities: [__dirname + '/**/*.models{.ts,.js}'],
      synchronize: true,
    }),
    TypeOrmModule.forFeature([
      User,
      Client,
      Hotel,
      Room,
      AdminHotels,
      Reservation,
      PaymentReservation,
      Payment
    ]),
    AuthModule,
    HttpModule,
  ],
  controllers: [
    UsersController,
    ClientsController,
    HotelsController,
    AdminHotelsController,
    RoomsController,
    PaymentBookingController,
    BookingController,
    PaymentController,
  ],
  providers: [
    UsersService,
    ClientsService,
    HotelsService,
    AdminHotelsService,
    RoomsService,
    BookingService,
    PaymentBookingService,
    PaymentService,
  ],
})
export class AppModule {}
