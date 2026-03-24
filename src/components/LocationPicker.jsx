import { useState } from 'react';
import roaLogo from '../assets/roa-logo.png';

const ACCENT = 'var(--p)';

export default function LocationPicker({ locations, onSelect, onSignOut, user }) {
  const [selected, setSelected] = useState(null);
  const [saving, setSaving]     = useState(false);

  const handleConfirm = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await onSelect(selected);
      // onSnapshot in useLocation will pick up the change automatically
    } catch (err) {
      console.error('Failed to join location:', err);
      setSaving(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      background: '#080809', gap: 20, padding: 24,
    }}>
      <img src={roaLogo} alt="ROA Off-Road" style={{ width: 90, opacity: .8, marginBottom: 8 }} />

      <div style={{
        fontFamily: "'Bebas Neue',sans-serif", fontSize: 28,
        letterSpacing: '.08em', color: '#f0ece6',
      }}>
        Select Your Location
      </div>

      <div style={{
        fontFamily: "'Barlow',sans-serif", fontSize: 13,
        color: 'rgba(255,255,255,.4)', textAlign: 'center', lineHeight: 1.6, maxWidth: 380,
      }}>
        Welcome, {user?.email}. Choose the dealer location you represent. This links your account to that location's display.
      </div>

      {/* Location list */}
      <div style={{
        display: 'flex', flexDirection: 'column', gap: 8,
        width: '100%', maxWidth: 380, marginTop: 12,
      }}>
        {locations.map(loc => {
          const isSelected = selected === loc.id;
          return (
            <button
              key={loc.id}
              onClick={() => setSelected(loc.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '14px 18px',
                background: isSelected ? 'color-mix(in srgb, var(--p) 10%, transparent)' : 'rgba(255,255,255,.03)',
                border: `1px solid ${isSelected ? ACCENT : 'rgba(255,255,255,.1)'}`,
                cursor: 'pointer',
                transition: 'all .2s',
                textAlign: 'left',
              }}
            >
              {/* Radio dot */}
              <div style={{
                width: 16, height: 16, borderRadius: '50%', flexShrink: 0,
                border: `2px solid ${isSelected ? ACCENT : 'rgba(255,255,255,.2)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {isSelected && (
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: ACCENT }} />
                )}
              </div>

              <div>
                <div style={{
                  fontFamily: "'Barlow',sans-serif", fontSize: 14, fontWeight: 600,
                  color: isSelected ? '#f0ece6' : 'rgba(255,255,255,.6)',
                  letterSpacing: '.02em',
                }}>
                  {loc.name}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
        <button className="btn-cancel" onClick={onSignOut}>Sign Out</button>
        <button
          className="btn-apply"
          onClick={handleConfirm}
          disabled={!selected || saving}
          style={{ opacity: (!selected || saving) ? .4 : 1 }}
        >
          {saving ? 'Saving…' : 'Confirm'}
        </button>
      </div>
    </div>
  );
}
