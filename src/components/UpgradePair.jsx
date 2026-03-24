import { useState, useEffect, useRef } from 'react';

const PAGE_SIZE = 5;
const ROTATE_MS = 5000;
const FADE_MS   = 400;

export default function UpgradePair({ upgrades, theme }) {
  if (!upgrades.length) return null;

  const totalPages = Math.ceil(upgrades.length / PAGE_SIZE);
  const paginated  = totalPages > 1;

  const [page, setPage]       = useState(0);
  const [visible, setVisible] = useState(true);
  const timerRef = useRef(null);

  const fadeTo = p => {
    setVisible(false);
    setTimeout(() => { setPage(p); setVisible(true); }, FADE_MS);
  };

  // Auto-rotate
  useEffect(() => {
    if (!paginated) return;
    timerRef.current = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setPage(p => (p + 1) % totalPages);
        setVisible(true);
      }, FADE_MS);
    }, ROTATE_MS);
    return () => clearInterval(timerRef.current);
  }, [paginated, totalPages]);

  // Manual dot click resets the auto-rotate timer
  const handleDot = i => {
    clearInterval(timerRef.current);
    fadeTo(i);
    if (paginated) {
      timerRef.current = setInterval(() => {
        setVisible(false);
        setTimeout(() => {
          setPage(p => (p + 1) % totalPages);
          setVisible(true);
        }, FADE_MS);
      }, ROTATE_MS);
    }
  };

  // Reset page when upgrades change
  useEffect(() => { setPage(0); setVisible(true); }, [upgrades.length]);

  const pad = n => String(n + 1).padStart(2, '0');

  const rowStyle = {
    display: 'flex', alignItems: 'flex-start', gap: 14,
    padding: '10px 16px', background: 'rgba(255,255,255,.04)',
    borderLeft: '3px solid ' + theme.p,
  };
  const numStyle = {
    fontFamily: "'Bebas Neue',sans-serif", fontSize: 'clamp(20px,2vw,28px)', lineHeight: 1,
    color: theme.p, opacity: .38, minWidth: 24, flexShrink: 0,
  };
  const txtStyle = {
    fontFamily: "'Barlow',sans-serif", fontSize: 'clamp(13px,1.2vw,16px)', fontWeight: 600,
    color: theme.text, lineHeight: 1.35, paddingTop: 2,
  };

  const start = page * PAGE_SIZE;
  const slice = upgrades.slice(start, start + PAGE_SIZE);

  return (
    <div>
      <div style={{
        display: 'flex', flexDirection: 'column', gap: 6,
        opacity: visible ? 1 : 0,
        transition: `opacity ${FADE_MS}ms ease`,
      }}>
        {slice.map((u, i) => (
          <div key={u.id} style={rowStyle}>
            <div style={numStyle}>{pad(start + i)}</div>
            <div style={txtStyle}>{u.text}</div>
          </div>
        ))}
      </div>

      {paginated && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 10 }}>
          {Array.from({ length: totalPages }, (_, i) => (
            <button key={i} onClick={() => handleDot(i)} style={{
              width: 7, height: 7, borderRadius: '50%', border: 'none', padding: 0, cursor: 'pointer',
              background: i === page ? theme.p : 'rgba(255,255,255,.18)',
              transition: 'background .3s ease',
            }} />
          ))}
        </div>
      )}
    </div>
  );
}
