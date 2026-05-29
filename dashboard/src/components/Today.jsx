import { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { supabase } from '../supabase';
import { fmt, Loading, CATEGORY_COLORS, CustomTooltip } from './ui';

export default function Today() {
  const [rows, setRows]   = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    supabase
      .from('visits')
      .select('*')
      .gte('visited_at', start.toISOString())
      .then(({ data, error }) => {
        if (error) setError(error.message);
        else setRows(data);
      });
  }, []);

  if (!rows) return <Loading />;
  if (error) return <div style={{ color: 'rgba(232,204,216,0.4)', fontStyle: 'italic' }}>{error}</div>;

  const siteMap = {}, catMap = {};
  let totalSecs = 0;
  for (const r of rows) {
    siteMap[r.domain]  = (siteMap[r.domain]  || 0) + r.duration_seconds;
    catMap[r.category] = (catMap[r.category] || 0) + r.duration_seconds;
    totalSecs += r.duration_seconds;
  }

  const topSites = Object.entries(siteMap).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const catData  = Object.entries(catMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  const maxTime  = topSites[0]?.[1] || 1;
  const topCat   = catData[0];

  return (
    <div>
      {/* gero */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 32 }}>
        <div className="stat-card fade-1" style={{ gridColumn: '1 / 2' }}>
          <div className="eyebrow">total screen time today</div>
          <div className="hero-stat">{fmt(totalSecs)}</div>
        </div>
        <div className="stat-card fade-2">
          <div className="eyebrow">sites visited</div>
          <div className="hero-stat" style={{ fontSize: 'clamp(40px, 6vw, 68px)' }}>
            {Object.keys(siteMap).length}
          </div>
        </div>
        <div className="stat-card fade-3">
          <div className="eyebrow">top category</div>
          <div className="hero-stat" style={{ fontSize: 'clamp(28px, 4vw, 44px)', letterSpacing: 0 }}>
            {topCat?.name ?? '—'}
          </div>
          {topCat && (
            <div style={{ fontSize: 11, color: 'var(--lilac-muted)', marginTop: 6 }}>
              {fmt(topCat.value)} · {Math.round((topCat.value / totalSecs) * 100)}% of day
            </div>
          )}
        </div>
      </div>

      {/* main content */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, alignItems: 'start' }}>

        {/* top sites */}
        <div className="card fade-4">
          <div className="section-title">top sites</div>
          {topSites.length === 0 ? (
            <div style={{ color: 'var(--lilac-muted)', fontStyle: 'italic', fontSize: 13 }}>no data yet today</div>
          ) : topSites.map(([domain, secs], i) => (
            <div key={domain} className="site-row">
              <span style={{
                fontSize: 10,
                color: i === 0 ? 'var(--lilac)' : 'rgba(232,204,216,0.18)',
                textAlign: 'right',
                fontFamily: 'var(--font-ui)',
              }}>
                {i + 1}
              </span>
              <div style={{ minWidth: 0 }}>
                <div style={{
                  fontFamily: 'var(--font-body)',
                  fontStyle: 'italic',
                  fontSize: 13,
                  color: 'var(--lilac)',
                  opacity: 0.85,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  marginBottom: 5,
                }}>
                  {domain}
                </div>
                <div className="site-bar-wrap">
                  <div className="site-bar" style={{ width: `${Math.round((secs / maxTime) * 100)}%` }} />
                </div>
              </div>
              <span style={{ fontSize: 12, color: 'var(--lilac-soft)', whiteSpace: 'nowrap', fontFamily: 'var(--font-ui)' }}>
                {fmt(secs)}
              </span>
            </div>
          ))}
        </div>

        {/* cat donut */}
        <div className="card fade-5">
          <div className="section-title">by category</div>
          {catData.length === 0 ? (
            <div style={{ color: 'var(--lilac-muted)', fontStyle: 'italic', fontSize: 13 }}>no data yet</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={170}>
                <PieChart>
                  <Pie data={catData} cx="50%" cy="50%" innerRadius={48} outerRadius={76} paddingAngle={2} dataKey="value" strokeWidth={0}>
                    {catData.map(e => <Cell key={e.name} fill={CATEGORY_COLORS[e.name] || '#888'} opacity={0.88} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip labelFmt={fmt} />} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {catData.map(({ name, value }) => (
                  <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: CATEGORY_COLORS[name] || '#888', flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: 'var(--lilac)', opacity: 0.7, flex: 1, fontFamily: 'var(--font-ui)' }}>{name}</span>
                    <span style={{ fontSize: 11, color: 'var(--lilac-muted)', fontFamily: 'var(--font-ui)' }}>{fmt(value)}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
