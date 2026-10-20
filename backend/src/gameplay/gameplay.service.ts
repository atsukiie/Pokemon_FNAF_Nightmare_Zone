import { ForbiddenException, Injectable, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseEnv } from 'node:util';
import { mapGameplayRecords, EncounterRecord, GamePlayer, PokemonRecord } from './map-gameplay';

@Injectable()
export class GameplayService {
  private readonly client: SupabaseClient | null;
  constructor(private readonly config: ConfigService) {
    let external: Record<string, string | undefined> = {};
    const file = config.get<string>('GAME_ENV_FILE');
    if (file) {
      try { external = parseEnv(readFileSync(resolve(process.cwd(), file), 'utf8')); }
      catch { throw new Error('Unable to read GAME_ENV_FILE. Check the server-side configuration path.'); }
    }
    const url = config.get<string>('SUPABASE_URL') || external.SUPABASE_URL;
    const key = config.get<string>('SUPABASE_SERVICE_ROLE_KEY') || external.SUPABASE_SERVICE_ROLE_KEY;
    this.client = url && key ? createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } }) : null;
  }
  get isConfigured() { return this.client !== null; }
  private getClient() {
    if (!this.client) throw new ServiceUnavailableException('Configure the shared game database on the dashboard backend.');
    return this.client;
  }
  async authorize(authorization: string | undefined, remoteAddress: string | undefined, origin?: string) {
    const loopback = ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(remoteAddress || '');
    const localMode = this.config.get<string>('DASHBOARD_LOCAL_MODE') === 'true' && process.env.NODE_ENV !== 'production';
    const trustedOrigin = !origin || origin === this.config.get<string>('FRONTEND_URL', 'http://localhost:3000');
    if (localMode && loopback && trustedOrigin) return;
    const token = authorization?.match(/^Bearer (\S+)$/i)?.[1];
    if (!token) throw new UnauthorizedException('An administrator access token is required.');
    const { data, error } = await this.getClient().auth.getUser(token);
    if (error || !data.user) throw new UnauthorizedException('Invalid or expired access token.');
    if (data.user.app_metadata?.role !== 'admin') throw new ForbiddenException('Administrator access required.');
  }
  private async readRows<T>(table: string, columns: string, key: string, realOnly = false): Promise<T[]> {
    const rows: T[] = [];
    // Keyset pagination avoids the default 1,000-row limit and shifting offsets.
    let cursor: string | number | undefined;
    for (;;) {
      let query = this.getClient().from(table).select(columns).order(key).limit(500);
      if (realOnly) query = query.eq('data_source', 'real');
      if (cursor !== undefined) query = query.gt(key, cursor);
      const { data, error } = await query;
      if (error || !data) throw new ServiceUnavailableException(`Unable to read game ${table} records.`);
      if (!data.length) return rows;
      rows.push(...(data as unknown as T[]));
      if (rows.length > 20000) throw new ServiceUnavailableException('Dataset exceeds 20,000 records. Add server-side period aggregation.');
      cursor = (data[data.length - 1] as unknown as Record<string, string | number>)[key];
      if (cursor === undefined) throw new ServiceUnavailableException('Invalid game record cursor.');
    }
  }
  async dashboard() {
    // Encounters include their logged turns. Ongoing runs are intentionally not
    // reconstructed from completed encounters or the aggregate active-run count.
    const encounters = await this.readRows<EncounterRecord>('encounters', 'id,run_id,session_id,player_id,player_name,night,team,team_state,opponent,hp_start,hp_end,damage_dealt,item_used,outcome,data_source,created_at,turn_count,turns(turn_number,active_pokemon,damage_taken)', 'id', true);
    const players = await this.readRows<GamePlayer>('players', 'id,display_name', 'id');
    const pokemon = await this.readRows<PokemonRecord>('pokemon', 'id,name,types', 'id');
    return mapGameplayRecords(players, encounters, pokemon);
  }
}
