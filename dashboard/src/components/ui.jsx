export function fmt(seconds) {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export function Loading() {
  return <div className="loading">loading…</div>;
}

export const CATEGORY_COLORS = {
  Dev:           '#b8a8c8',
  Productivity:  '#E8CCD8',
  Social:        '#d4b0c0',
  Learning:      '#c8d4b8',
  News:          '#c8c0b0',
  Entertainment: '#c0b8d0',
  Finance:       '#b8c8c8',
  Shopping:      '#d0c0b8',
  Other:         '#888780',
};

export function CustomTooltip({ active, payload, labelFmt }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#6e6e6c',
      border: '1px solid rgba(232,204,216,0.15)',
      borderRadius: 6,
      padding: '9px 13px',
      fontSize: 12,
      color: 'var(--lilac)',
      fontFamily: 'var(--font-ui)',
      boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
    }}>
      <div style={{ fontWeight: 500, marginBottom: 2 }}>{payload[0].name || payload[0].payload?.label}</div>
      <div style={{ opacity: 0.65 }}>{labelFmt ? labelFmt(payload[0].value) : payload[0].value}</div>
    </div>
  );
}
