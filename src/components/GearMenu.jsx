import { useState, useEffect, useRef } from 'react';

const THEMES = {
  ember:   { name: 'Ember',   p: '#E87722' },
  arctic:  { name: 'Arctic',  p: '#4da6ff' },
  forge:   { name: 'Forge',   p: '#b8f040' },
  crimson: { name: 'Crimson', p: '#e83838' },
  gold:    { name: 'Gold',    p: '#d4a017' },
};

export default function GearMenu({ themeKey, setThemeKey, onEdit }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  // Keyboard shortcut: Ctrl+Shift+E
  useEffect(() => {
    const h = e => {
      if (e.ctrlKey && e.shiftKey && e.key === 'E') {
        setOpen(false);
        onEdit();
      }
    };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [onEdit]);

  return (
    <div className="gear-wrap" ref={ref}>
      {open && (
        <div className="gear-menu">
          <div className="gear-section">Theme</div>
          {Object.entries(THEMES).map(([key, t]) => (
            <button
              key={key}
              className="gear-item"
              onClick={() => setThemeKey(key)}
              style={{ color: key === themeKey ? t.p : 'rgba(255,255,255,.45)' }}
            >
              <span className="theme-dot" style={{ background: t.p }} />
              {t.name}
            </button>
          ))}
          <div style={{ height: 1, background: 'rgba(255,255,255,.07)', margin: '6px 0' }} />
          <button className="gear-item" onClick={() => { setOpen(false); onEdit(); }}>
            ✎ Edit Display
          </button>
        </div>
      )}
      <button className="gear-btn" onClick={() => setOpen(o => !o)} title="Settings (Ctrl+Shift+E)">
        ⚙
      </button>
    </div>
  );
}
