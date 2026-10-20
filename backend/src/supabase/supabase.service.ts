import { ForbiddenException, Injectable, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private readonly client: SupabaseClient | null;

  constructor(private readonly config: ConfigService) {
    const url = config.get<string>('SUPABASE_URL');
    const key = config.get<string>('SUPABASE_PUBLISHABLE_KEY');
    this.client = url && key ? createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    }) : null;
  }

  get isConfigured(): boolean { return this.client !== null; }

  getClient(): SupabaseClient {
    if (!this.client) throw new ServiceUnavailableException('Configure Supabase in backend/.env first.');
    return this.client;
  }

  async getAdminClient(authorization?: string): Promise<SupabaseClient> {
    const token = authorization?.match(/^Bearer (\S+)$/i)?.[1];
    if (!token) throw new UnauthorizedException('An administrator access token is required.');
    const client = this.getClient();
    const { data, error } = await client.auth.getUser(token);
    if (error || !data.user) throw new UnauthorizedException('Invalid or expired access token.');
    if (data.user.app_metadata?.role !== 'admin') throw new ForbiddenException('Administrator access required.');
    // Each request gets an isolated user-scoped client; never share auth sessions.
    return createClient(this.config.getOrThrow<string>('SUPABASE_URL'), this.config.getOrThrow<string>('SUPABASE_PUBLISHABLE_KEY'), {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
}
