import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login/client')
  async loginClient(@Body() body: { email: string; password: string }) {
    const client = await this.authService.validateClient(body.email, body.password);
    return this.authService.login('client', client);
  }

  @Post('login/user')
  async loginUser(@Body() body: { email: string; password: string }) {
    const user = await this.authService.validateUser(body.email, body.password);
    return this.authService.login('user', user);
  }

  @Post('login-super-admin')
  async loginSuperAdmin(@Body('email') email: string, @Body('password') password: string) {
    return this.authService.loginSuperAdmin(email, password);
  }
}
