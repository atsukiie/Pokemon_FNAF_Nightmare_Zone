import { Controller, Get, Header, Headers, ServiceUnavailableException } from '@nestjs/common';
import { SupabaseService } from './supabase/supabase.service';
import { GameplayService } from './gameplay/gameplay.service';

@Controller()
export class AppController {
  constructor(private readonly supabase: SupabaseService, private readonly gameplay?: GameplayService) {}

  @Get('health')
  health() {
    return { status: 'ok', service: 'nightmare-zone-api', databaseConfigured: this.gameplay?.isConfigured || this.supabase.isConfigured, dataSource: 'shared-game-supabase' };
  }

  @Get('dashboard/legacy')
  @Header('Cache-Control', 'no-store')
  async dashboard(@Headers('authorization') authorization?: string) {
    const client = await this.supabase.getAdminClient(authorization);
    const { data, error } = await client.rpc('get_admin_dashboard');
    if (error) throw new ServiceUnavailableException('Gameplay records unavailable. Verify the dashboard database migration and access policies.');
    return data;
  }
}
