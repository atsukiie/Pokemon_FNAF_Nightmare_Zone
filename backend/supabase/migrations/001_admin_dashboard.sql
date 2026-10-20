-- LEGACY ALTERNATE SCHEMA: not used by the PokemonzApp gameplay adapter.
-- Do not apply this to connect the existing game; its tables are read directly.
-- Run manually in your shared project's Supabase SQL editor after reviewing
-- the game repository's schema. This does not seed sample records.
begin;

create table public.nz_players (
  id text primary key,
  name text not null,
  pokemon text not null,
  dex integer not null check (dex > 0),
  level integer not null check (level > 0),
  type text not null,
  hp integer not null check (hp >= 0),
  max_hp integer not null check (max_hp > 0 and hp <= max_hp),
  condition text not null check (condition in ('Healthy', 'Injured', 'Tired', 'Critical')),
  active boolean not null default false
);
create table public.nz_sessions (
  id text primary key,
  label text not null,
  night integer not null check (night > 0),
  session_order integer not null unique check (session_order > 0)
);
create table public.nz_battles (
  id text primary key,
  player_id text not null references public.nz_players(id),
  session_id text not null references public.nz_sessions(id),
  opponent text not null,
  outcome text not null check (outcome in ('win', 'loss')),
  starting_hp integer not null check (starting_hp >= 0),
  remaining_hp integer not null check (remaining_hp >= 0),
  damage_dealt integer not null check (damage_dealt >= 0),
  damage_received integer not null check (damage_received >= 0),
  items_used integer not null default 0 check (items_used >= 0),
  recorded_at timestamptz not null default now()
);
create index nz_battles_player_session_idx on public.nz_battles(player_id, session_id);
create index nz_battles_session_idx on public.nz_battles(session_id);

alter table public.nz_players enable row level security;
alter table public.nz_sessions enable row level security;
alter table public.nz_battles enable row level security;
revoke all on public.nz_players, public.nz_sessions, public.nz_battles from anon, authenticated;
grant select on public.nz_players, public.nz_sessions, public.nz_battles to authenticated;
create policy "admin_read_players" on public.nz_players for select to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
create policy "admin_read_sessions" on public.nz_sessions for select to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
create policy "admin_read_battles" on public.nz_battles for select to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- One statement returns a consistent snapshot, without PostgREST's row limit
-- silently truncating battle history. Fail visibly beyond this starter's limit.
create function public.get_admin_dashboard() returns jsonb
language plpgsql stable security invoker set search_path = '' as $$
begin
  if coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') <> 'admin' then
    raise exception 'Administrator access required' using errcode = '42501';
  end if;
  if (select count(*) from (select 1 from public.nz_battles limit 20001) b) > 20000 then
    raise exception 'Dashboard record limit exceeded; add server-side period aggregation before loading more than 20000 battles';
  end if;
  return jsonb_build_object(
    'players', coalesce((select jsonb_agg(jsonb_build_object(
      'id', id, 'name', name, 'pokemon', pokemon, 'dex', dex, 'level', level,
      'type', type, 'hp', hp, 'maxHp', max_hp, 'condition', condition, 'active', active
    ) order by name, id) from public.nz_players), '[]'::jsonb),
    'sessions', coalesce((select jsonb_agg(jsonb_build_object(
      'id', id, 'label', label, 'night', night, 'order', session_order
    ) order by session_order) from public.nz_sessions), '[]'::jsonb),
    'battles', coalesce((select jsonb_agg(jsonb_build_object(
      'id', id, 'playerId', player_id, 'sessionId', session_id, 'opponent', opponent,
      'outcome', outcome, 'startingHp', starting_hp, 'remainingHp', remaining_hp,
      'damageDealt', damage_dealt, 'damageReceived', damage_received, 'itemsUsed', items_used
    ) order by recorded_at, id) from public.nz_battles), '[]'::jsonb)
  );
end;
$$;
revoke all on function public.get_admin_dashboard() from public, anon;
grant execute on function public.get_admin_dashboard() to authenticated;
commit;
