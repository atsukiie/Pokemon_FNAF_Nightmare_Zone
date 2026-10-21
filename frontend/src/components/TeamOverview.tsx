'use client';

import { useState } from 'react';
import Icon from './Icon';
import PerformanceChart from './PerformanceChart';
import { average, Battle, hasHp, hpBandLabel, hpPercent, Player, Session, stats } from '../lib/dashboard';

type Props = { players: Player[]; battles: Battle[]; sessions: Session[]; historical?: boolean; onPlayer: (player: Player) => void; onEvidence: (text: string) => void };
const hp = hpPercent;

export default function TeamOverview({ players, battles, sessions, historical = false, onPlayer, onEvidence }: Props) {
  const [metric, setMetric] = useState('Win rate');
  const healthyActive = players.filter(p => (historical || p.active) && p.condition === 'Healthy');
  const lowHpRecords = players.filter(p => hasHp(p) && (p.condition !== 'Healthy' || hp(p) <= 40)).sort((a, b) => hp(a) - hp(b));
  const total = stats(battles);
  const types = [...new Set(players.map(p => p.type))].map(type => ({ type, members: players.filter(p => p.type === type) }));
  const rows = players.map(player => {
    const records = battles.filter(b => b.playerId === player.id), s = stats(records);
    return { player, ...s, value: metric === 'Win rate' ? s.winRate : metric === 'Current HP' ? hp(player) : s.wins };
  }).sort((a, b) => b.value - a.value || a.player.name.localeCompare(b.player.name));
  const max = metric === 'Battles won' ? Math.max(1, ...rows.map(r => r.value)) : 100;
  const matchups = [...new Set(battles.map(b => b.opponent))].map(opponent => ({ opponent, ...stats(battles.filter(b => b.opponent === opponent)) })).sort((a, b) => b.played - a.played || b.winRate - a.winRate);
  const nights = [...new Set(sessions.map(s => s.night))].sort((a, b) => a - b).map(night => {
    const ids = new Set(sessions.filter(s => s.night === night).map(s => s.id));
    const records = battles.filter(b => ids.has(b.sessionId));
    return { night, ...stats(records), remaining: average(records.map(b => b.remainingHp)) };
  }).filter(n => n.played > 0);

  return <div className="team-overview">
    <section className="panel team-readiness">
      <div className="panel-heading"><h2><Icon name="shield"/> TEAM READINESS</h2><span className="ai-label">{historical ? 'LAST RECORDED HP' : 'CURRENT ROSTER'}</span></div>
      <div className="readiness-body"><div className="readiness-score"><strong>{healthyActive.length}<span> / {players.length}</span></strong><small>{historical ? 'High HP snapshots' : 'High HP & active'}</small></div><div className="readiness-copy"><h3>{!players.length ? 'No players in this selection' : lowHpRecords.length ? `${lowHpRecords.length} players have low recorded HP` : 'No low-HP snapshots in this selection'}</h3><p>{historical ? 'Current activity unavailable' : `${players.filter(p => p.active).length} active players · ${players.filter(p => p.active === false).length} inactive`} · {players.some(hasHp) ? Math.round(average(players.filter(hasHp).map(hp))) + '% average recorded HP' : 'No HP recorded'}</p><span>{historical ? 'HP bands are inferred from completed encounter snapshots. New nights reset HP; these are not live player states.' : 'HP snapshots and activity describe the current roster; they do not predict survival.'}</span></div></div>
    </section>

    <div className="team-overview-pair">
      <section className="panel composition-panel"><div className="panel-heading"><h2><Icon name="ball"/> ROSTER COMPOSITION</h2><span className="count-badge">{types.length} types</span></div><div className="composition-list">{types.map(({ type, members }) => { const pokemonNames = members.map(p => p.pokemon).join(', '); return <div className={`composition-row type-${type.toLowerCase()}`} key={type}><span className="composition-type"><i/>{type}</span><div className="composition-bar"><span style={{ width: `${members.length / players.length * 100}%` }}/></div><strong>{members.length}</strong><small className="scroll-label" title={pokemonNames}>{pokemonNames}</small></div>; })}{!types.length && <div className="empty">No roster members to group.</div>}</div><p className="team-panel-note">Representative Pokémon by type (last active Pokémon for recorded game data). Type variety alone does not measure matchup coverage.</p></section>
      <section className="panel contribution-panel"><div className="panel-heading"><h2><Icon name="chart"/> MEMBER COMPARISON</h2><select aria-label="Team comparison metric" value={metric} onChange={e => setMetric(e.target.value)}>{['Win rate', 'Current HP', 'Battles won'].map(m => <option key={m}>{m}</option>)}</select></div><div className="contribution-list">{rows.map(row => <button className="contribution-row" key={row.player.id} onClick={() => onPlayer(row.player)}><span className="contribution-name"><span className="scroll-label" title={row.player.name}>{row.player.name}</span><small className="scroll-label" title={row.player.pokemon}>{row.player.pokemon}</small></span><span className="contribution-bar"><i style={{ width: `${row.value / max * 100}%` }}/></span><strong>{(metric === 'Win rate' && !row.played) || (metric === 'Current HP' && !hasHp(row.player)) ? '—' : `${Math.round(row.value)}${metric === 'Battles won' ? '' : '%'}`}</strong><Icon name="chevron" size={13}/></button>)}{!rows.length && <div className="empty">No members to compare.</div>}</div><p className="team-panel-note">{metric === 'Current HP' ? 'Recorded HP as a percentage of each Pokémon’s starting HP.' : `Based on ${total.played} battles in the selected period.`} Select a member to inspect their records.</p></section>
    </div>

    <PerformanceChart sessions={sessions} battles={battles} players={players}/>

    <section className="panel team-night-history"><div className="panel-heading"><h2><Icon name="moon"/> NIGHT-BY-NIGHT RESULTS</h2><span className="muted tiny">Selected period</span></div><div className="table-scroll"><table><thead><tr>{['Night', 'Battles', 'Wins / losses', 'Win rate', 'Avg. HP remaining', 'Avg. damage received'].map(label => <th key={label}><span className="scroll-label" title={label}>{label}</span></th>)}</tr></thead><tbody>{nights.map(n => <tr key={n.night}>{[`Night ${n.night}`, String(n.played), `${n.wins} / ${n.losses}`, `${Math.round(n.winRate)}%`, n.remaining.toFixed(1), n.damageRecords ? n.received.toFixed(1) : '—'].map((label, index) => <td key={index} className={index === 3 ? 'win-rate' : undefined}><span className="scroll-label" title={label}>{label}</span></td>)}</tr>)}</tbody></table></div>{!nights.length && <div className="empty">No battle results in this period.</div>}<p className="team-panel-note">HP remaining is the recorded post-battle value, not the current roster HP.</p></section>

    <section className="panel team-matchups"><div className="panel-heading"><h2><Icon name="target"/> OPPONENT MATCHUPS</h2><span className="count-badge">{matchups.length}</span></div><div className="matchup-list">{matchups.map(m => <button className="matchup-row" key={m.opponent} onClick={() => onEvidence(`${m.opponent}: ${m.wins} wins and ${m.losses} losses across ${m.played} battles (${Math.round(m.winRate)}% win rate). Average damage received ${m.received.toFixed(1)}. These are observed outcomes in the selected period, not inherent type advantages. Opponent difficulty, player level, and composition are not controlled.`)}><span className="matchup-name"><strong className="scroll-label" title={m.opponent}>{m.opponent}</strong><small className="scroll-label" title={`${m.wins} wins · ${m.losses} losses · ${m.played} battles`}>{m.wins} wins · {m.losses} losses · {m.played} battles</small></span><span className="matchup-rate">{Math.round(m.winRate)}%<small>win rate</small></span><Icon name="chevron" size={14}/></button>)}</div>{!matchups.length && <div className="empty">No opponents recorded in this selection.</div>}<p className="team-panel-note">Observed results only. Select an opponent for supporting evidence.</p></section>
  </div>;
}
