import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { supabase } from '../supabase';
import { fmt, Loading, CATEGORY_COLORS, CustomTooltip } from './ui';

function startOf7Days() {
  const d = new Date();
  d.setDate(d.getDate() - 6);
  d.setHours(0, 0, 0, 0);
  return d;
}

function shortDay(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short' });
}

function longDay(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
}

export default function History() {
  const [rows, setRows]           = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);
  const [error, setError]         = useState(null);

  useEffect(() => {
    supabase
      .from('visits').select('*')
      .gte('visited_at', startOf7Days().toISOString())
      .order('visited_at', { ascending: true })
      .then(({ data, error }) => {
        if (error) { setError(error.message); return; }
        setRows(data);
        if (data?.length) {
          const days = [...new Set(data.map(r => r.visited_at.slice(0, 10)))];
          setSelectedDay(days[days.length - 1]);
        }
      });
  }, []);

  if (!rows) return <Loading />;
  if (error)  return <div style={{ color: 'rgba(232,204,216,0.4)', fontStyle: 'italic' }}>{error}</div>;

  const dayMap = {};
  for (const r of rows) {
    const d = r.visited_at.slice(0, 10);
    dayMap[d] = (dayMap[d] || 0) + r.duration_seconds;
  }

  const chartData = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    chartData.push({ day: key, label: shortDay(key), total: dayMap[key] || 0 });
  }

  const weekTotal = Object.values(dayMap).reduce((a, b) => a + b, 0);
  const avgDay    = weekTotal / 7;
  const bestDay   = chartData.reduce((a, b) => b.total > a.total ? b : a, chartData[0]);

  const dayRows = selectedDay ? rows.filter(r => r.visited_at.startsWith(selectedDay)) : [];
  const siteMap = {}, catMap = {};
  for (const r of dayRows) {
    siteMap[r.domain]  = (siteMap[r.domain]  || 0) + r.duration_seconds;
    catMap[r.category] = (catMap[r.category] || 0) + r.duration_seconds;
  }
  const topSites = Object.entries(siteMap).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const maxSite  = topSites[0]?.[1] || 1;
  const dayTotal = dayRows.reduce((s, r) => s + r.duration_seconds, 0);

  return (
    <div>
      {/* week summary stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
        {[
          { label: 'week total', value: fmt(weekTotal) },
          { label: 'daily average', value: fmt(Math.round(avgDay)) },
          { label: 'heaviest day', value: shortDay(bestDay?.day) },
        ].map(({ label, value }, i) => (
          <div key={label} className={`stat-card fade-${i + 1}`}>
            <div className="eyebrow">{label}</div>
            <div className="hero-stat" style={{ fontSize: 'clamp(30px, 4vw, 48px)' }}>{value}</div>
          </div>
        ))}
      </div>

      {/* bar chart */}
      <div className="card fade-4" style={{ marginBottom: 24 }}>
        <div className="section-title">last 7 days</div>
        <div className="eyebrow" style={{ marginBottom: 24 }}>click a bar to drill in</div>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={chartData} barCategoryGap="35%" onClick={e => e?.activePayload && setSelectedDay(e.activePayload[0].payload.day)}>
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: 'rgba(232,204,216,0.4)', fontFamily: 'var(--font-ui)' }}
              axisLine={false} tickLine={false}
            />
            <YAxis hide />
            <Tooltip content={<CustomTooltip labelFmt={fmt} />} cursor={{ fill: 'rgba(232,204,216,0.04)' }} />
            <Bar dataKey="total" radius={[4, 4, 0, 0]}>
              {chartData.map(e => (
                <Cell key={e.day} fill={e.day === selectedDay ? '#E8CCD8' : 'rgba(232,204,216,0.2)'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* day drill-down */}
      {selectedDay && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: 20, alignItems: 'start' }} className="fade-1">
          <div className="card">
            <div className="section-title">{longDay(selectedDay)}</div>
            <div style={{ fontSize: 11, color: 'var(--lilac-muted)', marginBottom: 22, fontFamily: 'var(--font-ui)' }}>
              {fmt(dayTotal)} total &nbsp;·&nbsp; {Object.keys(siteMap).length} sites visited
            </div>
            {topSites.length === 0 ? (
              <div style={{ color: 'var(--lilac-muted)', fontStyle: 'italic', fontSize: 13 }}>no data for this day</div>
            ) : topSites.map(([domain, secs], i) => (
              <div key={domain} className="site-row">
                <span style={{ fontSize: 10, color: i === 0 ? 'var(--lilac)' : 'rgba(232,204,216,0.18)', textAlign: 'right', fontFamily: 'var(--font-ui)' }}>
                  {i + 1}
                </span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontFamily: 'var(--font-body)', fontStyle: 'italic', fontSize: 13, color: 'var(--lilac)', opacity: 0.85, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: 5 }}>
                    {domain}
                  </div>
                  <div className="site-bar-wrap">
                    <div className="site-bar" style={{ width: `${Math.round((secs / maxSite) * 100)}%` }} />
                  </div>
                </div>
                <span style={{ fontSize: 12, color: 'var(--lilac-soft)', whiteSpace: 'nowrap', fontFamily: 'var(--font-ui)' }}>
                  {fmt(secs)}
                </span>
              </div>
            ))}
          </div>

          <div className="card">
            <div className="eyebrow" style={{ marginBottom: 18 }}>categories</div>
            {Object.entries(catMap).sort((a, b) => b[1] - a[1]).map(([cat, secs]) => {
              const pct = Math.round((secs / dayTotal) * 100);
              return (
                <div key={cat} style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: CATEGORY_COLORS[cat] || '#888', flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: 'var(--lilac)', opacity: 0.75, flex: 1, fontFamily: 'var(--font-ui)' }}>{cat}</span>
                    <span style={{ fontSize: 11, color: 'var(--lilac-muted)', fontFamily: 'var(--font-ui)' }}>{pct}%</span>
                  </div>
                  <div style={{ height: 2, background: 'rgba(232,204,216,0.08)', borderRadius: 1, overflow: 'hidden', marginLeft: 15 }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: CATEGORY_COLORS[cat] || '#888', opacity: 0.65, borderRadius: 1, transition: 'width 0.6s ease' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
