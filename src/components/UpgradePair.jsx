import { useState, useEffect } from 'react';

export default function UpgradePair({ upgrades, theme }) {
  const len = upgrades.length;
  const [idx, setIdx]         = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (len < 3) return; // ≤2 items: no cycling needed
    const cycle = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIdx(i => (i + 2) % len);
        setVisible(true);
      }, 1250);
    }, 5500);
    return () => clearInterval(cycle);
  }, [len]);

  if (!len) return null;

  const u1 = upgrades[idx % len];
  // Only show u2 if there are at least 2 distinct items to show
  const u2idx = (idx + 1) % len;
  const u2 = len > 1 ? upgrades[u2idx] : null;

  const rowBase = {
    display: 'flex', alignItems: 'flex-start', gap: 14,
    padding: '13px 16px', background: 'rgba(255,255,255,.04)',
    borderLeft: '3px solid ' + theme.p,
  };
  const numStyle = {
    fontFamily: "'Bebas Neue',sans-serif", fontSize: 30, lineHeight: 1,
    color: theme.p, opacity: .38, minWidth: 28, flexShrink: 0,
  };
  const txtStyle = {
    fontFamily: "'Barlow',sans-serif", fontSize: 15, fontWeight: 600,
    color: theme.text, lineHeight: 1.35, paddingTop: 2,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ ...rowBase, opacity: visible ? 1 : 0, transition: 'opacity 1.2s ease' }}>
        <div style={numStyle}>01</div>
        <div style={txtStyle}>{u1.text}</div>
      </div>
      {u2 && (
        <div style={{ ...rowBase, opacity: visible ? 1 : 0, transition: 'opacity 1.2s ease .5s' }}>
          <div style={numStyle}>02</div>
          <div style={txtStyle}>{u2.text}</div>
        </div>
      )}
    </div>
  );
}
