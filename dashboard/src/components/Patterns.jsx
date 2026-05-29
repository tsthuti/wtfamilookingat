import { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { Loading } from './ui';

const DAYS  = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

function hourLabel(h) {
  if (h === 0)  return '12a';
  if (h === 12) return '12p';
  return h < 12 ? `${h}a` : `${h - 12}p`;
}

function fmt(s) {
  if (s < 60) return `${Math.round(s)}s`;
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export default function Patterns() {
  const [rows, setRows]     = useState(null);
  const [tooltip, setTip]   = useState(null);
  const [error, setError]   = useState(null);

  useEffect(() => {
    supabase.from('visits').select('hour_of_day, day_of_week, duration_seconds')
      .then(({ data, error }) => {
        if (error) setError(error.message);
        else setRows(data);
      });
  }, []);

  if (!rows) return <Loading />;
  if (error)  return <div style={{ color: 'rgba(232,204,216,0.4)', fontStyle: 'italic' }}>{error}</div>;

  const grid = Array.from({ length: 7 }, () => Array(24).fill(0));
  let maxVal = 0;
  for (const r of rows) {
    if (r.day_of_week != null && r.hour_of_day != null) {
      grid[r.day_of_week][r.hour_of_day] += r.duration_seconds;
      if (grid[r.day_of_week][r.hour_of_day] > maxVal) maxVal = grid[r.day_of_week][r.hour_of_day];
    }
  }

  const hourTotals  = HOURS.map(h => DAYS.reduce((s, _, d) => s + grid[d][h], 0));
  const dayTotals   = grid.map(d => d.reduce((a, b) => a + b, 0));
  const peakHour    = hourTotals.indexOf(Math.max(...hourTotals));
  const peakDayIdx  = dayTotals.indexOf(Math.max(...dayTotals));

  function opacity(val) {
    if (!maxVal || !val) return 0;
    return 0.08 + (val / maxVal) * 0.88;
  }

  return (
    <div>
      {/* stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32, maxWidth: 680 }}>
        {[
          { label: 'peak hour', value: hourLabel(peakHour) },
          { label: 'most active day', value: DAYS[peakDayIdx] },
          { label: 'days tracked', value: [...new Set(rows.map(r => r.day_of_week))].length },
        ].map(({ label, value }, i) => (
          <div key={label} className={`stat-card fade-${i + 1}`}>
            <div className="eyebrow">{label}</div>
            <div className="hero-stat" style={{ fontSize: 'clamp(32px, 5vw, 52px)' }}>{value}</div>
          </div>
        ))}
      </div>

      <div className="card fade-4" style={{ position: 'relative' }}>
        <div className="section-title">activity heatmap</div>
        <div className="eyebrow" style={{ marginBottom: 24 }}>all time · hover a cell for details</div>

        <div style={{ overflowX: 'auto' }}>
          <div style={{ minWidth: 580 }}>
            {/* hour axis */}
            <div style={{ display: 'flex', marginLeft: 38, marginBottom: 8 }}>
              {HOURS.map(h => (
                <div key={h} style={{ flex: 1, textAlign: 'center', fontSize: 9, color: 'var(--lilac-muted)', fontFamily: 'var(--font-ui)', letterSpacing: '0.04em' }}>
                  {h % 4 === 0 ? hourLabel(h) : ''}
                </div>
              ))}
            </div>

            {/* rows */}
            {DAYS.map((day, d) => (
              <div key={day} style={{ display: 'flex', alignItems: 'center', marginBottom: 5 }}>
                <div style={{ width: 30, fontSize: 10, color: 'var(--lilac-muted)', fontFamily: 'var(--font-ui)', textAlign: 'right', paddingRight: 8, letterSpacing: '0.05em', flexShrink: 0 }}>
                  {day}
                </div>
                {HOURS.map(h => (
                  <div
                    key={h}
                    onMouseEnter={e => grid[d][h] && setTip({ x: e.clientX, y: e.clientY, day, hour: h, val: grid[d][h] })}
                    onMouseLeave={() => setTip(null)}
                    style={{
                      flex: 1,
                      aspectRatio: '1.2',
                      borderRadius: 2,
                      background: `rgba(232,204,216,${opacity(grid[d][h]).toFixed(3)})`,
                      margin: '0 1.5px',
                      cursor: grid[d][h] ? 'crosshair' : 'default',
                      transition: 'transform 0.1s',
                    }}
                    onMouseOver={e => { if (grid[d][h]) e.currentTarget.style.transform = 'scale(1.3)'; }}
                    onMouseOut={e => { e.currentTarget.style.transform = 'scale(1)'; }}
                  />
                ))}
              </div>
            ))}

            {/* legend */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 18, marginLeft: 38 }}>
              <span style={{ fontSize: 9, color: 'var(--lilac-muted)', fontFamily: 'var(--font-ui)', marginRight: 2 }}>less</span>
              {[0.05, 0.2, 0.4, 0.65, 0.95].map(o => (
                <div key={o} style={{ width: 11, height: 11, borderRadius: 2, background: `rgba(232,204,216,${o})` }} />
              ))}
              <span style={{ fontSize: 9, color: 'var(--lilac-muted)', fontFamily: 'var(--font-ui)', marginLeft: 2 }}>more</span>
            </div>
          </div>
        </div>
      </div>

      {/* floating tooltip */}
      {tooltip && (
        <div style={{
          position: 'fixed',
          left: tooltip.x + 12,
          top: tooltip.y - 36,
          background: '#6e6e6c',
          border: '1px solid rgba(232,204,216,0.15)',
          borderRadius: 5,
          padding: '7px 11px',
          fontSize: 11,
          color: 'var(--lilac)',
          fontFamily: 'var(--font-ui)',
          pointerEvents: 'none',
          zIndex: 999,
          boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
          whiteSpace: 'nowrap',
        }}>
          {tooltip.day} {hourLabel(tooltip.hour)} · {fmt(tooltip.val)}
        </div>
      )}
    </div>
  );
}
