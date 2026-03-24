import { useState, useEffect, useRef } from 'react';
import { THEMES } from '../constants.js';

export default function GearMenu({ themeKey, setThemeKey, onEdit, onManagePages, user, onSignOut, locationName }) {
  const [open, setOpen] = useState(false);
  const [showHint, setShowHint] = useState(true);
  const ref = useRef(null);

  // Click-outside to close
  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  // Dismiss hint after 8 seconds
  useEffect(() => {
    const t = setTimeout(() => setShowHint(false), 8000);
    return () => clearTimeout(t);
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

  const handleOpen = () => {
    setOpen(o => !o);
    setShowHint(false);
  };

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
          <button className="gear-item" onClick={() => { setOpen(false); onManagePages(); }}>
            ☰ Manage Pages
          </button>

          {user && (
            <>
              <div className="gear-section">Account</div>
              {locationName && (
                <div style={{
                  padding: '4px 12px',
                  fontFamily: "'Barlow',sans-serif", fontSize: 10, fontWeight: 600,
                  color: 'rgba(255,255,255,.45)', letterSpacing: '.1em',
                  textTransform: 'uppercase',
                }}>
                  {locationName}
                </div>
              )}
              <div style={{
                padding: '4px 12px',
                fontFamily: "'Barlow',sans-serif", fontSize: 9,
                color: 'rgba(255,255,255,.3)', letterSpacing: '.05em',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {user.email}
              </div>
              <button className="gear-item" onClick={() => { onSignOut(); setOpen(false); }}>
                Sign Out
              </button>
            </>
          )}
        </div>
      )}
      <button
        className={`gear-btn${showHint ? ' hint' : ''}${user ? ' authed' : ''}`}
        onClick={handleOpen}
        title="Settings (Ctrl+Shift+E)"
      >
        ⚙
      </button>
    </div>
  );
}
