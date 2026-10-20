import { Controller, Get, Redirect } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Controller()
export class RootController {
  constructor(private readonly config: ConfigService) {}

  @Get()
  @Redirect()
  index() {
    return {
      url: this.config.get<string>('FRONTEND_URL', 'http://localhost:3000'),
      statusCode: 302,
    };
  }
}
