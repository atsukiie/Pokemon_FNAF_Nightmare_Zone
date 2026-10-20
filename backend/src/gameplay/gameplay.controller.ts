import { BadRequestException, Body, Controller, Get, Header, Headers, Post, Req } from '@nestjs/common';
import type { IncomingMessage } from 'node:http';
import { GameplayService } from './gameplay.service';

@Controller()
export class GameplayController {
  constructor(private readonly gameplay: GameplayService) {}
  @Post('auth/login')
  @Header('Cache-Control', 'no-store')
  async login(@Body() body: { accessCode?: unknown }, @Req() req: IncomingMessage) {
    if (typeof body?.accessCode !== 'string' || !body.accessCode.trim()) {
      throw new BadRequestException('Enter the admin access code.');
    }
    return this.gameplay.signInWithAccessCode(body.accessCode, req.socket.remoteAddress);
  }
  @Post('auth/logout')
  @Header('Cache-Control', 'no-store')
  logout(@Headers('authorization') authorization?: string) {
    return this.gameplay.signOut(authorization);
  }
  @Get('dashboard/live')
  @Header('Cache-Control', 'no-store')
  async live(@Req() req: IncomingMessage, @Headers('authorization') authorization?: string, @Headers('origin') origin?: string) {
    await this.gameplay.authorize(authorization, req.socket.remoteAddress, origin);
    return this.gameplay.liveStatus();
  }
  @Get('dashboard')
  @Header('Cache-Control', 'no-store')
  async dashboard(@Req() req: IncomingMessage, @Headers('authorization') authorization?: string, @Headers('origin') origin?: string) {
    await this.gameplay.authorize(authorization, req.socket.remoteAddress, origin);
    return this.gameplay.dashboard();
  }
}
