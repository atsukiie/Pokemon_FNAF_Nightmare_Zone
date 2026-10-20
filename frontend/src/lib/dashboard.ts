export type Condition = 'Healthy' | 'Injured' | 'Tired' | 'Critical' | 'Unknown';
export type RosterMember = { pokemon: string; dex: number | null; type: string; hp: number | null; maxHp: number | null };
export type Player = { id: string; name: string; pokemon: string; dex: number | null; level: number | null; type: string; hp: number | null; maxHp: number | null; condition: Condition; active: boolean | null; roster?: RosterMember[]; recordedAt?: string | null };
export type Session = { id: string; label: string; night: number; order: number };
export type Battle = { id: string; playerId: string; sessionId: string; opponent: string; outcome: 'win' | 'loss'; startingHp: number; remainingHp: number; damageDealt: number; damageReceived: number | null; itemsUsed: number | null };
export type Dataset = { players: Player[]; sessions: Session[]; battles: Battle[]; metadata?: { source: string; dataSource: string; snapshot: string; activityAvailable: boolean; levelAvailable: boolean; conditionsInferred: boolean; generatedAt: string } };
export const hasHp = (p: { hp: number | null; maxHp: number | null }) => p.hp !== null && p.maxHp !== null && p.maxHp > 0;
export const hpPercent = (p: { hp: number | null; maxHp: number | null }) => hasHp(p) ? p.hp! / p.maxHp! * 100 : 0;
export const sampleData: Dataset = {
  players: [
    { id: 'vean', name: 'Vean', pokemon: 'Pikachu', dex: 25, level: 18, type: 'Electric', hp: 72, maxHp: 100, condition: 'Healthy', active: true },
    { id: 'clark', name: 'Clark', pokemon: 'Gengar', dex: 94, level: 16, type: 'Ghost', hp: 58, maxHp: 100, condition: 'Injured', active: true },
    { id: 'mika', name: 'Mika', pokemon: 'Jigglypuff', dex: 39, level: 15, type: 'Fairy', hp: 46, maxHp: 100, condition: 'Tired', active: true },
    { id: 'renz', name: 'Renz', pokemon: 'Charizard', dex: 6, level: 17, type: 'Fire', hp: 63, maxHp: 100, condition: 'Healthy', active: true },
    { id: 'aira', name: 'Aira', pokemon: 'Gardevoir', dex: 282, level: 14, type: 'Psychic', hp: 40, maxHp: 100, condition: 'Injured', active: false },
  ],
  sessions: [
    { id: 'n1s1', label: 'Session 1', night: 1, order: 1 },
    { id: 'n1s2', label: 'Session 2', night: 1, order: 2 },
    { id: 'n2s1', label: 'Session 3', night: 2, order: 3 },
    { id: 'n2s2', label: 'Session 4', night: 2, order: 4 },
    { id: 'n3s1', label: 'Session 5', night: 3, order: 5 },
  ], battles: [],
};
// Deterministic fictional fixtures. Never substitute these for actual gameplay records.
const wins = [[3, 3, 4, 2, 3], [2, 2, 3, 1, 3], [1, 2, 3, 2, 2], [3, 3, 3, 2, 3], [1, 2, 2, 1, 2]];
sampleData.players.forEach((player, p) => sampleData.sessions.forEach((session, s) => {
  for (let b = 0; b < 4; b++) {
    const win = b < wins[p][s], start = Math.min(100, 62 + ((p * 7 + s * 11 + b * 9) % 39));
    const damage = (win ? 10 : 30) + p * 2 + s * 2 + b;
    sampleData.battles.push({ id: `${player.id}-${session.id}-${b}`, playerId: player.id, sessionId: session.id, opponent: ['Shadow Freddy', 'Mimikyu', 'Haunter', 'Nightmare Bonnie'][b], outcome: win ? 'win' : 'loss', startingHp: start, remainingHp: Math.max(0, start - damage), damageDealt: (win ? 58 : 28) + s * 3 + p * 2, damageReceived: damage, itemsUsed: win ? b % 2 : 1 + (p % 2) });
  }
}));
export const average = (values: number[]) => values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
export function stats(battles: Battle[]) {
  const wins = battles.filter(b => b.outcome === 'win').length;
  const damage = battles.map(b => b.damageReceived).filter((n): n is number => n !== null);
  const knownItems = battles.every(b => b.itemsUsed !== null);
  return { played: battles.length, wins, losses: battles.length - wins, winRate: battles.length ? wins / battles.length * 100 : 0, items: knownItems ? battles.reduce((a, b) => a + b.itemsUsed!, 0) : null, dealt: average(battles.map(b => b.damageDealt)), received: damage.length ? average(damage) : 0, damageRecords: damage.length, itemsKnown: knownItems };
}
export function correlation(x: number[], y: number[]): number | null {
  if (x.length < 3 || x.length !== y.length) return null;
  const mx = average(x), my = average(y);
  const denominator = Math.sqrt(x.reduce((a, v) => a + (v - mx) ** 2, 0) * y.reduce((a, v) => a + (v - my) ** 2, 0));
  return denominator ? x.reduce((a, v, i) => a + (v - mx) * (y[i] - my), 0) / denominator : null;
}
export function historicalEstimate(records: Battle[]) {
  const { wins, played: n, winRate } = stats(records);
  if (!n) return 'Insufficient battle history to estimate a historical win rate.';
  const z = 1.96, p = wins / n, d = 1 + z * z / n;
  const center = (p + z * z / (2 * n)) / d, margin = z * Math.sqrt(p * (1 - p) / n + z * z / (4 * n * n)) / d;
  return `Historical win rate ${Math.round(winRate)}%; 95% Wilson interval ${Math.round((center - margin) * 100)}–${Math.round((center + margin) * 100)}% across ${n} battles. This describes past outcomes, not an evaluated next-battle forecast. Repeated players and sessions may not be independent.`;
}
const bundledPokemon = new Set([3, 6, 9, 25, 94, 39, 282]);
export const artwork = (dex: number | null) => dex === null ? '' : bundledPokemon.has(dex) ? `/pokemon/${dex}.png` : `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${dex}.png`;
export function isDataset(value: unknown): value is Dataset {
  if (!value || typeof value !== 'object') return false;
  const d = value as Dataset;
  if (!Array.isArray(d.players) || !Array.isArray(d.sessions) || !Array.isArray(d.battles)) return false;
  const finite = (n: unknown) => typeof n === 'number' && Number.isFinite(n);
  const string = (v: unknown) => typeof v === 'string' && v.length > 0;
  if (!d.players.every(p => p && string(p.id) && string(p.name) && string(p.pokemon) && (p.dex === null || finite(p.dex)) && (p.level === null || finite(p.level)) && string(p.type) && ((p.hp === null && p.maxHp === null) || (finite(p.hp) && finite(p.maxHp) && p.maxHp! > 0 && p.hp! >= 0 && p.hp! <= p.maxHp!)) && ['Healthy', 'Injured', 'Tired', 'Critical', 'Unknown'].includes(p.condition) && (p.active === null || typeof p.active === 'boolean'))) return false;
  if (!d.sessions.every(s => s && string(s.id) && string(s.label) && finite(s.night) && finite(s.order))) return false;
  if (!d.players.every(p => p.roster === undefined || (Array.isArray(p.roster) && p.roster.every(m => m && string(m.pokemon) && string(m.type) && (m.dex === null || finite(m.dex)) && (m.hp === null || (finite(m.hp) && m.hp >= 0)) && (m.maxHp === null || (finite(m.maxHp) && m.maxHp > 0)))))) return false;
  if (new Set(d.players.map(p => p.id)).size !== d.players.length || new Set(d.sessions.map(s => s.id)).size !== d.sessions.length || new Set(d.battles.map(b => b?.id)).size !== d.battles.length) return false;
  return d.battles.every(b => b && string(b.id) && d.players.some(p => p.id === b.playerId) && d.sessions.some(s => s.id === b.sessionId) && string(b.opponent) && ['win', 'loss'].includes(b.outcome) && [b.startingHp, b.remainingHp, b.damageDealt].every(n => finite(n) && n >= 0) && [b.damageReceived, b.itemsUsed].every(n => n === null || (finite(n) && n >= 0)));
}
