import { useState, useEffect } from 'react';
import { useDelivery } from './hooks/useDelivery.js';
import { useCatalog }  from './hooks/useCatalog.js';
import UpgradePair from './components/UpgradePair.jsx';
import GearMenu    from './components/GearMenu.jsx';
import AdminPanel  from './components/AdminPanel.jsx';
import roaLogo from './assets/roa-logo.png';

const THEMES = {
  ember:   { name: 'Ember',   p: '#E87722', bg: '#080809', surface: 'rgba(10,10,14,.82)',  accent: '#ff9a44', text: '#f0ece6' },
  arctic:  { name: 'Arctic',  p: '#4da6ff', bg: '#060810', surface: 'rgba(8,12,20,.84)',   accent: '#7ec8ff', text: '#e8f0f8' },
  forge:   { name: 'Forge',   p: '#b8f040', bg: '#070908', surface: 'rgba(8,12,8,.84)',    accent: '#d4ff70', text: '#eef5e8' },
  crimson: { name: 'Crimson', p: '#e83838', bg: '#090608', surface: 'rgba(14,8,8,.84)',    accent: '#ff6060', text: '#f5e8e8' },
  gold:    { name: 'Gold',    p: '#d4a017', bg: '#090806', surface: 'rgba(14,12,6,.84)',   accent: '#f0c840', text: '#f5f0e0' },
};

export default function App() {
  const { delivery, setDelivery, loading: deliveryLoading } = useDelivery();
  const { manufacturers, models, loading: catalogLoading }  = useCatalog();
  const [themeKey, setThemeKey]   = useState('ember');
  const [showAdmin, setAdmin]     = useState(false);
  const [nameKey, setNameKey]     = useState(0);

  // Sync theme from delivery doc
  useEffect(() => {
    if (delivery?.theme) setThemeKey(delivery.theme);
  }, [delivery?.theme]);

  const theme = THEMES[themeKey] || THEMES.ember;

  useEffect(() => {
    document.documentElement.style.setProperty('--p', theme.p);
  }, [themeKey]);

  const handleThemeChange = key => {
    setThemeKey(key);
    if (delivery) setDelivery({ ...delivery, theme: key });
  };

  const handleDeliveryChange = d => {
    setDelivery(d);
    setNameKey(k => k + 1);
  };

  if (deliveryLoading || catalogLoading) {
    return (
      <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#080809' }}>
        <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 22, letterSpacing: '.2em', color: 'rgba(255,255,255,.25)' }}>
          Loading…
        </div>
      </div>
    );
  }

  // Resolve display values
  const roamers        = delivery.roamers || [];
  const upgrades       = delivery.upgrades || [];
  const dealer         = delivery.dealer || '';
  const firstAdventure = delivery.firstAdventure || '';
  const mfgLogoUrl     = delivery.mfgLogoUrl || '';
  const bgImageUrl     = delivery.bgImageUrl || '';

  // Look up model name from catalog, or fall back to stored modelId
  const catalogModel = models.find(m => m.id === delivery.modelId);
  const modelName    = catalogModel?.name || delivery.modelId || 'Model TBD';

  const panelGrad = `linear-gradient(162deg, ${theme.surface} 0%, rgba(10,8,5,.94) 100%)`;

  const bgImg = bgImageUrl
    ? { backgroundImage: `url(${bgImageUrl})` }
    : { background: `radial-gradient(ellipse at 70% 38%, ${theme.p}0a 0%, transparent 55%), ${theme.bg}` };

  return (
    <>
      {/* BACKGROUND */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, overflow: 'hidden', background: theme.bg }}>
        <div style={{
          position: 'absolute', inset: '-8%',
          backgroundSize: 'cover', backgroundPosition: 'center center',
          animation: 'kb 26s ease-in-out infinite',
          ...bgImg,
        }} />
        <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(110deg,${theme.bg}f6 0%,${theme.bg}dc 36%,${theme.bg}66 62%,${theme.bg}1a 100%)` }} />
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, transparent 36%, rgba(0,0,0,.58) 100%)' }} />
        <div className="noise" />
      </div>

      {/* STAGE */}
      <div style={{
        position: 'relative', zIndex: 1,
        width: '100vw', height: '100vh',
        display: 'grid', gridTemplateColumns: `1fr min(408px, 30vw)`,
      }}>

        {/* ━━━ LEFT PANEL ━━━ */}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '0 0 64px 70px', position: 'relative' }}>
          {/* Vertical seam */}
          <div style={{ position: 'absolute', right: 0, top: '9%', bottom: '9%', width: 1, background: `linear-gradient(to bottom, transparent,${theme.p},transparent)`, opacity: .28 }} />

          {/* Manufacturer logo */}
          <div style={{ position: 'absolute', top: 36, left: 70, animation: 'fadeIn .8s ease .1s both' }}>
            {mfgLogoUrl && (
              <img src={mfgLogoUrl} alt="Manufacturer"
                style={{ width: 130, maxWidth: 220, objectFit: 'contain', filter: 'brightness(1.15) drop-shadow(0 2px 14px rgba(0,0,0,.65))', opacity: 0.92 }}
              />
            )}
          </div>

          {/* Eyebrow */}
          <div style={{ fontFamily: "'Barlow',sans-serif", fontWeight: 300, fontSize: 'clamp(11px,1.05vw,14px)', letterSpacing: '.32em', textTransform: 'uppercase', color: theme.p, marginBottom: 18, animation: 'fadeUp .6s ease .6s both' }}>
            {dealer ? `${dealer} Welcomes` : 'ROA Off-Road Welcomes'}
          </div>

          {/* Customer name(s) */}
          <div key={nameKey}>
            {roamers.map((r, i) => (
              <div key={r.id} style={{ overflow: 'hidden' }}>
                <span style={{
                  display: 'block',
                  fontFamily: "'Bebas Neue',sans-serif",
                  fontSize: roamers.length > 1 ? 'clamp(52px,7vw,108px)' : 'clamp(68px,9.5vw,148px)',
                  lineHeight: .88, color: theme.text, letterSpacing: '.015em', textTransform: 'uppercase',
                  textShadow: '0 2px 40px rgba(0,0,0,.55)',
                  animation: `nameIn .75s cubic-bezier(.22,.68,0,1.1) ${0.78 + i * .12}s both`,
                }}>
                  {r.name || 'Your Roamer'}
                </span>
              </div>
            ))}
          </div>

          {/* Shimmer bar */}
          <div style={{
            width: 68, height: 3, margin: '24px 0 20px', transformOrigin: 'left',
            backgroundImage: `linear-gradient(90deg,${theme.p},${theme.accent},${theme.p})`,
            backgroundSize: '200% auto',
            animation: 'barGrow .8s cubic-bezier(.22,.68,0,1.2) 1.2s both, shimBar 3.2s linear 2.2s infinite',
          }} />

          {/* Model pill + dealer */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', animation: 'fadeUp .6s ease 1.3s both' }}>
            <div style={{ border: `1px solid ${theme.p}`, background: `${theme.p}1a`, padding: '6px 16px', fontFamily: "'Barlow',sans-serif", fontSize: 'clamp(11px,1.05vw,14px)', fontWeight: 600, letterSpacing: '.18em', textTransform: 'uppercase', color: theme.text }}>
              {modelName}
            </div>
            {dealer && (
              <div style={{ border: '1px solid rgba(255,255,255,.1)', padding: '6px 14px', fontFamily: "'Barlow',sans-serif", fontSize: 'clamp(10px,1vw,12px)', letterSpacing: '.24em', textTransform: 'uppercase', color: 'rgba(255,255,255,.4)', fontWeight: 300 }}>
                {dealer}
              </div>
            )}
          </div>
        </div>

        {/* ━━━ RIGHT PANEL ━━━ */}
        <div style={{
          display: 'flex', flexDirection: 'column',
          padding: '32px 36px 48px',
          background: panelGrad,
          backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
          borderLeft: '1px solid rgba(255,255,255,.07)',
          animation: 'slideR .75s cubic-bezier(.22,.68,0,1.1) .3s both',
        }}>
          {/* ROA Logo */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingBottom: 18, borderBottom: '1px solid rgba(255,255,255,.07)', marginBottom: 20 }}>
            <img src={roaLogo} alt="ROA Off-Road"
              style={{ width: 130, filter: `drop-shadow(0 4px 20px rgba(0,0,0,.5)) drop-shadow(0 0 36px ${theme.p}33)`, transition: 'filter .4s ease' }}
            />
            <div style={{ marginTop: 10, fontFamily: "'Barlow',sans-serif", fontWeight: 300, fontSize: 9, letterSpacing: '.32em', textTransform: 'uppercase', color: 'rgba(255,255,255,.3)', textAlign: 'center' }}>
              Authorized Dealer Network
            </div>
          </div>

          <div style={{ borderBottom: '1px solid rgba(255,255,255,.07)', marginBottom: 20 }} />

          {/* Welcome copy */}
          <div style={{ animation: 'fadeUp .7s ease .9s both' }}>
            <div style={{ fontFamily: "'Barlow',sans-serif", fontSize: 9, fontWeight: 700, letterSpacing: '.36em', textTransform: 'uppercase', color: theme.p, marginBottom: 10 }}>
              New {roamers.length === 1 ? 'Roamer' : 'Roamers'}
            </div>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 'clamp(30px,3.5vw,46px)', lineHeight: .96, letterSpacing: '.03em', textTransform: 'uppercase', color: theme.text, marginBottom: 14 }}>
              Welcome<br />Our New<br />{roamers.length === 1 ? 'Roamer!' : 'Roamers!'}
            </div>
            <div style={{ fontFamily: "'Barlow',sans-serif", fontSize: 'clamp(11px,1.05vw,13px)', fontWeight: 300, fontStyle: 'italic', lineHeight: 1.7, color: 'rgba(255,255,255,.38)' }}>
              Together we inspire others to achieve extraordinary excellence through belief, change, and progress.
            </div>
          </div>

          <div style={{ flex: 1 }} />

          {/* First Adventure */}
          {firstAdventure && (
            <div style={{ animation: 'fadeUp .7s ease 1.05s both', marginBottom: 22 }}>
              <div style={{ fontFamily: "'Barlow',sans-serif", fontSize: 9, fontWeight: 700, letterSpacing: '.3em', textTransform: 'uppercase', color: theme.p, marginBottom: 10 }}>
                First Adventure
              </div>
              <div style={{ padding: '14px 16px', background: 'rgba(255,255,255,.04)', borderLeft: `2px solid ${theme.p}` }}>
                <div style={{ fontFamily: "'Barlow',sans-serif", fontSize: 15, fontWeight: 400, fontStyle: 'italic', color: theme.text, opacity: .88, lineHeight: 1.55, letterSpacing: '.02em' }}>
                  {firstAdventure}
                </div>
              </div>
            </div>
          )}

          {/* Modifications */}
          {upgrades.length > 0 && (
            <div style={{ animation: 'fadeUp .7s ease 1.15s both' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontFamily: "'Barlow',sans-serif", fontSize: 9, fontWeight: 700, letterSpacing: '.3em', textTransform: 'uppercase', color: 'rgba(255,255,255,.3)' }}>
                  Modifications
                </span>
                <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 13, letterSpacing: '.1em', color: theme.p }}>
                  {upgrades.length} TOTAL
                </span>
              </div>
              <UpgradePair upgrades={upgrades} theme={theme} />
            </div>
          )}
        </div>
      </div>

      <GearMenu themeKey={themeKey} setThemeKey={handleThemeChange} onEdit={() => setAdmin(true)} />

      {showAdmin && (
        <AdminPanel
          delivery={delivery}
          setDelivery={handleDeliveryChange}
          theme={theme}
          manufacturers={manufacturers}
          models={models}
          onClose={() => setAdmin(false)}
        />
      )}
    </>
  );
}
