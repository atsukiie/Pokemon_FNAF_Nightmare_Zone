import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { SupabaseService } from './supabase/supabase.service';
import { RootController } from './root.controller';
import { GameplayController } from './gameplay/gameplay.controller';
import { GameplayService } from './gameplay/gameplay.service';

@Module({ imports: [ConfigModule.forRoot({ isGlobal: true })], controllers: [AppController, RootController, GameplayController], providers: [SupabaseService, GameplayService] })
export class AppModule {}
