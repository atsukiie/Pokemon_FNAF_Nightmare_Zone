'use client';
import { useId, useState } from 'react';
import { average, Battle, Session, stats } from '../lib/dashboard';

type Metric = 'Win rate' | 'Average HP' | 'Battles won' | 'Damage received';
export default function PerformanceChart({ sessions, battles }: { sessions: Session[]; battles: Battle[] }) {
  const [metric, setMetric] = useState<Metric>('Win rate');
  const [hover, setHover] = useState<number | null>(null);
  const gradient = useId().replaceAll(':', '');
  const points = [...sessions].sort((a, b) => a.order - b.order).slice(-5).map(session => {
    const records = battles.filter(b => b.sessionId === session.id), s = stats(records);
    const value = metric === 'Win rate' ? s.winRate : metric === 'Average HP' ? average(records.filter(b => b.startingHp > 0).map(b => b.remainingHp / b.startingHp * 100)) : metric === 'Battles won' ? s.wins : s.received;
    return { ...session, value, count: metric === 'Damage received' ? s.damageRecords : records.length };
  }).filter(p => p.count > 0);
  const max = metric === 'Win rate' || metric === 'Average HP' ? 100 : Math.max(4, ...points.map(p => Math.ceil(p.value / 4) * 4));
  const x = (i: number) => 48 + (points.length === 1 ? 240 : i * 480 / Math.max(1, points.length - 1));
  const y = (v: number) => 148 - v / max * 118;
  const line = points.map((p, i) => `${x(i)},${y(p.value)}`).join(' ');
  const best = points.length ? points.reduce((a, b) => (metric === 'Damage received' ? b.value < a.value : b.value > a.value) ? b : a) : null;
  const worst = points.length ? points.reduce((a, b) => (metric === 'Damage received' ? b.value > a.value : b.value < a.value) ? b : a) : null;
  const delta = points.length > 1 ? points.at(-1)!.value - points.at(-2)!.value : null;
  return <section className="panel performance" id="performance">
    <div className="panel-heading"><h2>TEAM PERFORMANCE <span>LAST 5 SESSIONS</span></h2><select aria-label="Performance metric" value={metric} onChange={e => { setMetric(e.target.value as Metric); setHover(null); }}>{['Win rate', 'Average HP', 'Battles won', 'Damage received'].map(m => <option key={m}>{m}</option>)}</select></div>
    {!points.length ? <div className="empty">No battle records in this period.</div> : <>
    <div className="chart-meta"><span><i className="legend-dot"/>{metric}{metric === 'Average HP' && ' (% of starting HP)'}</span><span className="muted">{delta === null ? 'First recorded session' : `${delta > 0 ? '+' : ''}${delta.toFixed(1)}${metric === 'Win rate' || metric === 'Average HP' ? ' pp' : ''} vs. previous session`}</span></div>
    <svg className="line-chart" viewBox="0 0 570 185" role="img" aria-label={`${metric} over ${points.length} sessions`}>
      <defs><linearGradient id={gradient} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#a855f7" stopOpacity=".28"/><stop offset="100%" stopColor="#a855f7" stopOpacity="0"/></linearGradient></defs>
      {[0, 1, 2, 3, 4].map(t => <g key={t}><line x1="48" x2="528" y1={y(t * max / 4)} y2={y(t * max / 4)} stroke="#28243e" strokeDasharray="3 4"/><text x="35" y={y(t * max / 4) + 4} textAnchor="end">{Math.round(t * max / 4)}</text></g>)}
      <polygon points={`${x(0)},148 ${line} ${x(points.length - 1)},148`} fill={`url(#${gradient})`}/>
      <polyline points={line} stroke="#c16bfa" fill="none" strokeWidth="2.5" strokeLinejoin="round"/>
      {points.map((p, i) => <g key={p.id}><line x1={x(i)} x2={x(i)} y1="30" y2="148" stroke="#28243e" opacity=".4"/><circle cx={x(i)} cy={y(p.value)} r={hover === i ? 6 : 4.5} fill="#c16bfa" stroke="#21102f" strokeWidth="2" tabIndex={0} aria-label={`${p.label}: ${p.value.toFixed(1)}`} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} onFocus={() => setHover(i)} onBlur={() => setHover(null)}/><text x={x(i)} y="173" textAnchor="middle">{p.label}</text></g>)}
      {hover !== null && points[hover] && <g pointerEvents="none"><rect x={Math.min(438, Math.max(48, x(hover) - 55))} y="2" width="110" height="23" rx="5" fill="#eee4ff"/><text x={Math.min(438, Math.max(48, x(hover) - 55)) + 55} y="18" textAnchor="middle" style={{ fill: '#251438' }}>{points[hover].value.toFixed(1)}{metric === 'Win rate' || metric === 'Average HP' ? '%' : ''} · Night {points[hover].night}</text></g>}
    </svg>
    <div className="chart-footer"><span>Best <strong>{best?.label}</strong></span><span>Lowest performance <strong>{worst?.label}</strong></span></div>
    </>}
  </section>;
}
