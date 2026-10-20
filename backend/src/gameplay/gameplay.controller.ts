import { Controller, Get, Header, Headers, Req } from '@nestjs/common';
import type { IncomingMessage } from 'node:http';
import { GameplayService } from './gameplay.service';

@Controller()
export class GameplayController {
  constructor(private readonly gameplay: GameplayService) {}
  @Get('dashboard')
  @Header('Cache-Control', 'no-store')
  async dashboard(@Req() req: IncomingMessage, @Headers('authorization') authorization?: string, @Headers('origin') origin?: string) {
    await this.gameplay.authorize(authorization, req.socket.remoteAddress, origin);
    return this.gameplay.dashboard();
  }
}
