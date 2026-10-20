export type GamePlayer = { id: string; display_name: string | null };
export type PokemonRecord = { id: number; name: string; types: string[] };
export type EncounterRecord = {
  id: number; run_id: string; session_id: string; player_id: string; player_name: string | null;
  night: number; team: string; team_state: { pokemon: string; hp_end: number }[] | null;
  opponent: string; hp_start: number; hp_end: number; damage_dealt: number; item_used: string | null;
  outcome: 'win' | 'loss'; data_source: string; created_at: string; turn_count: number;
  turns: { turn_number: number; active_pokemon: string; damage_taken: number }[];
};

const title = (s: string) => s ? s[0].toUpperCase() + s.slice(1) : 'Unknown';
export function mapGameplayRecords(registered: GamePlayer[], records: EncounterRecord[], catalog: PokemonRecord[]) {
  const encounters = records.filter(r => r.data_source === 'real').sort((a, b) => a.created_at.localeCompare(b.created_at) || a.id - b.id);
  const byName = new Map(catalog.map(p => [p.name.toLowerCase(), p]));
  const latest = new Map<string, EncounterRecord>();
  const identities = new Map(registered.map(p => [p.id, p]));
  for (const e of encounters) {
    latest.set(e.player_id, e);
    if (!identities.has(e.player_id)) identities.set(e.player_id, { id: e.player_id, display_name: e.player_name });
  }
  const condition = (hp: number | null, max: number | null) => hp === null || !max ? 'Unknown' : hp === 0 ? 'Critical' : hp / max <= .4 ? 'Injured' : hp / max <= .6 ? 'Tired' : 'Healthy';
  const players = [...identities.values()].map(p => {
    const e = latest.get(p.id);
    const lastTurn = e?.turns?.reduce<EncounterRecord['turns'][number] | null>((a, b) => !a || b.turn_number > a.turn_number ? b : a, null);
    const chosen = lastTurn?.active_pokemon || e?.team_state?.find(m => m.hp_end === e.hp_end)?.pokemon || e?.team.split(', ')[0];
    const species = chosen ? byName.get(chosen.toLowerCase()) : undefined;
    const max = e?.hp_start || null;
    const roster = e ? (e.team_state?.length ? e.team_state : e.team.split(', ').map(pokemon => ({ pokemon, hp_end: null }))).map(m => {
      const info = byName.get(m.pokemon.toLowerCase());
      return { pokemon: m.pokemon, dex: info?.id ?? null, type: title(info?.types[0] || ''), hp: m.hp_end, maxHp: max };
    }) : [];
    return { id: p.id, name: p.display_name || e?.player_name || p.id, pokemon: chosen || 'Not recorded', dex: species?.id ?? null, level: null, type: title(species?.types[0] || ''), hp: e?.hp_end ?? null, maxHp: max, condition: condition(e?.hp_end ?? null, max), active: null, roster, recordedAt: e?.created_at ?? null };
  });
  const groups = new Map<string, { id: string; label: string; night: number; order: number }>();
  for (const e of encounters) {
    const id = `${e.session_id}:night-${e.night}`;
    if (!groups.has(id)) groups.set(id, { id, label: `Session ${groups.size + 1}`, night: e.night, order: groups.size + 1 });
  }
  const battles = encounters.map(e => ({
    id: String(e.id), playerId: e.player_id, sessionId: `${e.session_id}:night-${e.night}`, opponent: e.opponent,
    outcome: e.outcome, startingHp: e.hp_start, remainingHp: e.hp_end, damageDealt: e.damage_dealt,
    damageReceived: e.turns?.length === e.turn_count ? e.turns.reduce((n, t) => n + t.damage_taken, 0) : null,
    itemsUsed: e.item_used === null ? 0 : null,
  }));
  return { players, sessions: [...groups.values()], battles, metadata: { source: 'game-supabase', dataSource: 'real', snapshot: 'latest-completed-encounter', activityAvailable: false, levelAvailable: false, conditionsInferred: true, generatedAt: new Date().toISOString() } };
}
