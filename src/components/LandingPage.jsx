import { useState } from 'react';
import roaLogo from '../assets/roa-logo.png';

export default function LandingPage({ onSignIn }) {
  const [signingIn, setSigningIn] = useState(false);

  const handleClick = async () => {
    setSigningIn(true);
    try {
      await onSignIn();
    } catch { /* popup cancelled */ }
    finally { setSigningIn(false); }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: '#080809',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden',
    }}>
      {/* Subtle radial glow */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse at 50% 45%, rgba(232,119,34,.06) 0%, transparent 60%)',
      }} />
      <div className="noise" />

      {/* Content card */}
      <div style={{
        position: 'relative', zIndex: 1,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        maxWidth: 420, width: '100%', padding: '0 24px',
        animation: 'fadeUp .6s ease both',
      }}>
        {/* Logo */}
        <img
          src={roaLogo}
          alt="ROA Off-Road"
          style={{
            width: 140, marginBottom: 32,
            filter: 'drop-shadow(0 4px 30px rgba(232,119,34,.2))',
          }}
        />

        {/* Title */}
        <div style={{
          fontFamily: "'Bebas Neue',sans-serif",
          fontSize: 'clamp(36px,5vw,52px)',
          letterSpacing: '.06em', lineHeight: .95,
          color: '#f0ece6', textAlign: 'center',
          marginBottom: 8,
        }}>
          Welcome Roamer
        </div>

        {/* Shimmer bar */}
        <div style={{
          width: 48, height: 2, margin: '16px 0 20px',
          backgroundImage: 'linear-gradient(90deg,#E87722,#ff9a44,#E87722)',
          backgroundSize: '200% auto',
          animation: 'shimBar 3s linear infinite',
        }} />

        {/* Subtitle */}
        <div style={{
          fontFamily: "'Barlow',sans-serif",
          fontSize: 'clamp(12px,1.2vw,15px)',
          fontWeight: 300, color: 'rgba(255,255,255,.45)',
          textAlign: 'center', lineHeight: 1.7,
          letterSpacing: '.04em', marginBottom: 40,
          maxWidth: 320,
        }}>
          Dealer Display Management Portal
        </div>

        {/* Google sign-in button */}
        <button
          className="google-btn"
          onClick={handleClick}
          disabled={signingIn}
          style={{ maxWidth: 300 }}
        >
          {signingIn ? (
            <span>Signing in…</span>
          ) : (
            <>
              <svg width="18" height="18" viewBox="0 0 48 48" style={{ marginRight: 10, flexShrink: 0 }}>
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              </svg>
              Sign in with Google
            </>
          )}
        </button>

        {/* Footer note */}
        <div style={{
          fontFamily: "'Barlow',sans-serif",
          fontSize: 10, fontWeight: 300,
          color: 'rgba(255,255,255,.2)',
          letterSpacing: '.15em', textTransform: 'uppercase',
          marginTop: 48, textAlign: 'center',
        }}>
          Authorized Dealer Network
        </div>
      </div>
    </div>
  );
}
