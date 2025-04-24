import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { ClientsService } from '../Services/clients/clients.service';
import { UsersService } from '../Services/users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly clientsService: ClientsService,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async validateClient(email: string, password: string): Promise<any> {
    const client = await this.clientsService.findOneByEmail(email);
    if (client && (await bcrypt.compare(password, client.password))) {
      const { password, ...result } = client;
      return result;
    }
    throw new UnauthorizedException('Invalid client credentials');
  }

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findOneByEmail(email);
    if (user && (await bcrypt.compare(password, user.password))) {
      const { password, ...result } = user;
      return result;
    }
    throw new UnauthorizedException('Invalid user credentials');
  }

  async login(entity: 'client' | 'user', payload: any) {
    const tokenPayload: any = { sub: payload.id, email: payload.email, role: entity };
    
    if (entity === 'user') {
      tokenPayload.has_premium_service = payload.has_premium_service;
      tokenPayload.has_vip_service = payload.has_vip_service;
    }

    return {
      access_token: this.jwtService.sign(tokenPayload),
      id: payload.id,
      email: payload.email,
      ...(entity === 'user' && {
        has_premium_service: payload.has_premium_service,
        has_vip_service: payload.has_vip_service
      })
    };
  }
}
