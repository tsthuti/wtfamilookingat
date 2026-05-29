import { useState } from 'react';
import './index.css';
import Today from './components/Today';
import Patterns from './components/Patterns';
import History from './components/History';

const ASCII = `⠀⠀⠀⠀⠀⠀⠀⠀⢀⣀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⡞⠉⠀⠉⢳⡀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⢷⣀⢀⣆⢀⡇⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠉⠉⣠⠞⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⢀⢣⡞⣡⡴⠖⠒⢶⣄
⠀⠀⠀⠀⠀⠀⠀⡉⣿⠀⡏⠀⠀⠀⠀⠙⣇
⠀⠀⠀⠀⠀⠀⠀⠁⢻⡄⣷⠀⠀⠀⢀⡀⡿⠆
⠀⠀⠀⠀⠀⠀⠀⠰⠮⠻⣜⢧⡀⠀⠿⠟⠁
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠼⢯⡳⣄⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠿⠻⣷⣄⠀⠀⠀⣼`;

const TABS = ['today', 'patterns', 'history'];

export default function App() {
  const [tab, setTab] = useState('today');

  return (
    <div style={{ minHeight: '100vh', position: 'relative', zIndex: 1 }}>

      {/* Header */}
      <header style={{
        borderBottom: '1px solid rgba(232,204,216,0.1)',
        padding: '0 48px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 60,
        position: 'sticky',
        top: 0,
        background: 'rgba(88,88,86,0.92)',
        backdropFilter: 'blur(12px)',
        zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 16 }}>
          <span style={{
            fontFamily: 'var(--font-display)',
            fontStyle: 'italic',
            fontSize: 18,
            color: 'var(--lilac)',
            letterSpacing: '0.01em',
          }}>
            wtf am i staring at
          </span>
          <span style={{
            fontFamily: 'var(--font-ui)',
            fontSize: 9,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'rgba(232,204,216,0.3)',
          }}>
            browsing analytics
          </span>
        </div>

        <nav style={{ display: 'flex', gap: 4 }}>
          {TABS.map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`tab-btn ${tab === t ? 'active' : 'inactive'}`}
            >
              {t}
            </button>
          ))}
        </nav>
      </header>

      {/* ASCII hehe*/}
      <div style={{
        position: 'fixed',
        top: 60,
        right: 0,
        fontFamily: 'monospace',
        fontSize: '5.5px',
        lineHeight: 1.15,
        color: 'rgba(232,204,216,0.14)',
        whiteSpace: 'pre',
        pointerEvents: 'none',
        zIndex: 0,
        padding: '20px 12px',
        userSelect: 'none',
      }}>
        {ASCII}
      </div>

      {/* page content */}
      <main style={{
        padding: '44px 48px',
        maxWidth: 1120,
        margin: '0 auto',
        position: 'relative',
        zIndex: 1,
      }}>
        {tab === 'today'    && <Today />}
        {tab === 'patterns' && <Patterns />}
        {tab === 'history'  && <History />}
      </main>
    </div>
  );
}
