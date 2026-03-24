import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth }       from './hooks/useAuth.js';
import { useLocation }   from './hooks/useLocation.js';
import { usePages }      from './hooks/usePages.js';
import { useActivePage } from './hooks/useActivePage.js';
import { useCatalog }    from './hooks/useCatalog.js';
import { useBgImage }    from './hooks/useBgImage.js';
import { DEFAULT_PAGE, THEMES } from './constants.js';
import UpgradePair     from './components/UpgradePair.jsx';
import GearMenu        from './components/GearMenu.jsx';
import AdminPanel      from './components/AdminPanel.jsx';
import PageManager     from './components/PageManager.jsx';
import LocationPicker  from './components/LocationPicker.jsx';
import LandingPage     from './components/LandingPage.jsx';
import roaLogo         from './assets/roa-logo.png';

export default function App() {
  const { user, loading: authLoading, signIn, signOut } = useAuth();
  const { location, locationId, allLocations, loading: locLoading, error: locError, updateLocation, joinLocation } = useLocation(user);
  const { pages, loading: pagesLoading, createPage, updatePage, removePage } = usePages(locationId);
  const { page: activePage, loading: activeLoading } = useActivePage(locationId, location?.activePageId);
  const { manufacturers, models, loading: catalogLoading } = useCatalog();

  const [themeKey, setThemeKey]        = useState('ember');
  const [showPageMgr, setShowPageMgr]  = useState(false);
  const [editingPage, setEditingPage]  = useState(null);
  const [preview, setPreview]          = useState(null);
  const [nameKey, setNameKey]          = useState(0);
  const [toast, setToast]              = useState(null);

  // Derive bgImageUrl early so the hook is called before any early returns
  const bgImageUrl = (preview || activePage || DEFAULT_PAGE).bgImageUrl || '';
  const { blur: bgBlur, key: bgKey } = useBgImage(bgImageUrl);

  // Sync theme from active page or location
  useEffect(() => {
    const t = activePage?.theme || location?.theme;
    if (t && THEMES[t]) setThemeKey(t);
  }, [activePage?.theme, location?.theme]);

  const theme = THEMES[themeKey] || THEMES.ember;

  useEffect(() => {
    document.documentElement.style.setProperty('--p', theme.p);
  }, [theme.p]);

  // Close admin flows on sign out
  useEffect(() => {
    if (!user) {
      setShowPageMgr(false);
      setEditingPage(null);
      setPreview(null);
    }
  }, [user]);

  const toastTimer = useRef(null);
  const showToast = useCallback(msg => {
    clearTimeout(toastTimer.current);
    setToast(msg);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  }, []);

  // ── Theme change → writes to location doc ──
  const handleThemeChange = useCallback(key => {
    setThemeKey(key);
    updateLocation({ theme: key });
  }, [updateLocation]);

  const handleSignOut = useCallback(async () => {
    await signOut();
  }, [signOut]);

  // ── Page management ──
  const handleActivate = useCallback(async pageId => {
    await updateLocation({ activePageId: pageId });
    showToast('Page activated');
  }, [updateLocation, showToast]);

  const handleCreatePage = useCallback(() => {
    setEditingPage({ ...DEFAULT_PAGE, dealer: location?.name || '' });
  }, [location?.name]);

  const handleDuplicate = useCallback(async page => {
    try {
      const { id, createdAt, updatedAt, ...data } = page;
      const newTitle = (data.title || 'Untitled') + ' (copy)';
      await createPage({ ...data, title: newTitle });
      showToast('Page duplicated');
    } catch (err) {
      console.error('Duplicate failed:', err);
      showToast('Duplicate failed');
    }
  }, [createPage, showToast]);

  const handleDeletePage = useCallback(async pageId => {
    try {
      await removePage(pageId);
      showToast('Page deleted');
    } catch (err) {
      console.error('Delete failed:', err);
      showToast('Delete failed');
    }
  }, [removePage, showToast]);

  const handleEditPage = useCallback(page => {
    setEditingPage(page);
  }, []);

  // ── Admin panel confirm/revert ──
  const handleConfirm = useCallback(async () => {
    if (!preview) return;
    try {
      if (editingPage?.id) {
        await updatePage(editingPage.id, preview);
      } else {
        const newId = await createPage(preview);
        if (!newId) {
          showToast('Save failed — no location');
          return;
        }
        if (!location?.activePageId) {
          await updateLocation({ activePageId: newId });
        }
      }
      setNameKey(k => k + 1);
      setEditingPage(null);
      setPreview(null);
      showToast('Changes saved');
    } catch (err) {
      console.error('Save failed:', err);
      showToast('Save failed — check permissions');
    }
  }, [preview, editingPage, updatePage, createPage, location?.activePageId, updateLocation, showToast]);

  const handleRevert = useCallback(() => {
    setEditingPage(null);
    setPreview(null);
  }, []);

  // ── Direct edit/manage (user is always authed at this point) ──
  const handleEditRequest = useCallback(() => {
    if (activePage) setEditingPage(activePage);
    else handleCreatePage();
  }, [activePage, handleCreatePage]);

  const handleManagePages = useCallback(() => {
    setShowPageMgr(true);
  }, []);

  // ── Loading (auth check first) ──
  if (authLoading) {
    return (
      <div style={{ position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#080809', gap: 24 }}>
        <img src={roaLogo} alt="ROA Off-Road" style={{ width: 120, animation: 'logoPulse 2.4s ease-in-out infinite' }} />
        <div style={{ fontFamily: "'Barlow',sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '.3em', textTransform: 'uppercase', color: 'rgba(255,255,255,.25)' }}>
          Loading…
        </div>
      </div>
    );
  }

  // ── Not authenticated → Landing page ──
  if (!user) {
    return <LandingPage onSignIn={signIn} />;
  }

  // ── Post-auth loading (location, catalog, pages) ──
  const isLoading = locLoading || catalogLoading ||
    (locationId && (pagesLoading || activeLoading));

  if (isLoading) {
    return (
      <div style={{ position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#080809', gap: 24 }}>
        <img src={roaLogo} alt="ROA Off-Road" style={{ width: 120, animation: 'logoPulse 2.4s ease-in-out infinite' }} />
        <div style={{ fontFamily: "'Barlow',sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '.3em', textTransform: 'uppercase', color: 'rgba(255,255,255,.25)' }}>
          Loading…
        </div>
      </div>
    );
  }

  // ── No location assigned — show location picker ──
  if (locError === 'no-location') {
    return (
      <LocationPicker
        locations={allLocations}
        onSelect={joinLocation}
        onSignOut={handleSignOut}
        user={user}
      />
    );
  }

  // ── Resolve display data ──
  const data = preview || activePage || DEFAULT_PAGE;

  const roamers        = data.roamers || [];
  const upgrades       = data.upgrades || [];
  const dealer         = data.dealer || location?.name || '';
  const firstAdventure = data.firstAdventure || '';
  const mfgLogoUrl     = data.mfgLogoUrl || '';

  const catalogModel = models.find(m => m.id === data.modelId);
  const modelName    = catalogModel?.name || data.modelId || 'Model TBD';

  const panelGrad = `linear-gradient(162deg, ${theme.surface} 0%, rgba(10,8,5,.82) 100%)`;

  const bgImg = bgImageUrl
    ? { backgroundImage: `url(${bgImageUrl})` }
    : { background: `radial-gradient(ellipse at 70% 38%, ${theme.p}0a 0%, transparent 55%), ${theme.bg}` };

  return (
    <>
      {/* BACKGROUND */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, overflow: 'hidden', background: theme.bg }}>
        <div key={bgKey} style={{
          position: 'absolute', inset: '-8%',
          backgroundSize: 'cover', backgroundPosition: 'center center',
          backgroundRepeat: 'no-repeat',
          animation: 'kb 26s ease-in-out 2 both',
          filter: bgBlur > 0 ? `blur(${bgBlur}px) saturate(1.2) brightness(1.05)` : 'none',
          transition: 'filter .6s ease',
          ...bgImg,
        }} />
        <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(110deg,${theme.bg}f6 0%,${theme.bg}dc 36%,${theme.bg}66 62%,${theme.bg}1a 100%)` }} />
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, transparent 36%, rgba(0,0,0,.58) 100%)' }} />
        <div className="noise" />
      </div>

      {/* STAGE */}
      <div className="stage" style={{
        position: 'relative', zIndex: 1,
        width: '100vw', height: '100vh',
        display: 'grid', gridTemplateColumns: '1fr min(408px, 30vw)',
      }}>

        {/* LEFT PANEL */}
        <div className="left-panel" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 0 0 70px', position: 'relative' }}>
          <div className="divider-line" style={{ position: 'absolute', right: 0, top: '9%', bottom: '9%', width: 1, background: `linear-gradient(to bottom, transparent,${theme.p},transparent)`, opacity: .28 }} />

          <div className="mfg-badge" style={{ position: 'absolute', top: 36, left: 70, animation: 'fadeIn .8s ease .1s both' }}>
            {mfgLogoUrl && (
              <img src={mfgLogoUrl} alt="Manufacturer"
                style={{ width: 130, maxWidth: 220, objectFit: 'contain', filter: 'brightness(1.15) drop-shadow(0 2px 14px rgba(0,0,0,.65))', opacity: 0.92 }}
              />
            )}
          </div>

          <div style={{ fontFamily: "'Barlow',sans-serif", fontWeight: 300, fontSize: 'clamp(14px,1.3vw,20px)', letterSpacing: '.32em', textTransform: 'uppercase', color: theme.p, marginBottom: 18, animation: 'fadeUp .6s ease .6s both' }}>
            {dealer ? `${dealer} Welcomes` : 'ROA Off-Road Welcomes'}
          </div>

          <div key={nameKey}>
            {roamers.map((r, i) => (
              <div key={r.id} style={{ overflow: 'hidden' }}>
                <span style={{
                  display: 'block', fontFamily: "'Bebas Neue',sans-serif",
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

          <div style={{
            width: 68, height: 3, margin: '24px 0 20px', transformOrigin: 'left',
            backgroundImage: `linear-gradient(90deg,${theme.p},${theme.accent},${theme.p})`,
            backgroundSize: '200% auto',
            animation: 'barGrow .8s cubic-bezier(.22,.68,0,1.2) 1.2s both, shimBar 3.2s linear 2.2s 3',
          }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', animation: 'fadeUp .6s ease 1.3s both' }}>
            <div style={{ border: `1px solid ${theme.p}`, background: `${theme.p}1a`, padding: '6px 16px', fontFamily: "'Barlow',sans-serif", fontSize: 'clamp(13px,1.2vw,18px)', fontWeight: 600, letterSpacing: '.18em', textTransform: 'uppercase', color: theme.text }}>
              {modelName}
            </div>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="right-panel" style={{
          display: 'flex', flexDirection: 'column', padding: '32px 36px 40px',
          background: panelGrad, backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
          borderLeft: '1px solid rgba(255,255,255,.07)',
          animation: 'slideR .75s cubic-bezier(.22,.68,0,1.1) .3s both',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingBottom: 18, borderBottom: '1px solid rgba(255,255,255,.07)', marginBottom: 20 }}>
            <img src={roaLogo} alt="ROA Off-Road"
              style={{ width: 130, filter: `drop-shadow(0 4px 20px rgba(0,0,0,.5)) drop-shadow(0 0 36px ${theme.p}33)`, transition: 'filter .4s ease' }}
            />
          </div>

          <div style={{ animation: 'fadeUp .7s ease .9s both', marginBottom: 16, textAlign: 'center' }}>
            <div style={{ fontFamily: "'Barlow',sans-serif", fontSize: 'clamp(10px,1vw,13px)', fontWeight: 700, letterSpacing: '.36em', textTransform: 'uppercase', color: theme.p, marginBottom: 10 }}>
              New {roamers.length === 1 ? 'Roamer' : 'Roamers'}
            </div>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 'clamp(30px,3.5vw,46px)', lineHeight: .96, letterSpacing: '.03em', textTransform: 'uppercase', color: theme.text }}>
              Welcome<br />Our New<br />{roamers.length === 1 ? 'Roamer!' : 'Roamers!'}
            </div>
          </div>

          <div style={{ animation: 'fadeUp .7s ease 1.05s both', marginBottom: 22 }}>
            <div style={{ fontFamily: "'Barlow',sans-serif", fontSize: 'clamp(10px,1vw,13px)', fontWeight: 700, letterSpacing: '.3em', textTransform: 'uppercase', color: theme.p, marginBottom: 10 }}>
              First Adventure
            </div>
            {firstAdventure ? (
              <div style={{ padding: '14px 16px', background: 'rgba(255,255,255,.04)', borderLeft: `2px solid ${theme.p}` }}>
                <div style={{ fontFamily: "'Barlow',sans-serif", fontSize: 'clamp(14px,1.3vw,18px)', fontWeight: 400, fontStyle: 'italic', color: theme.text, opacity: .88, lineHeight: 1.55, letterSpacing: '.02em' }}>
                  {firstAdventure}
                </div>
              </div>
            ) : (
              <div className="empty-state">No destination set yet</div>
            )}
          </div>

          <div style={{ flex: 1 }} />

          <div style={{ animation: 'fadeUp .7s ease 1.15s both' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontFamily: "'Barlow',sans-serif", fontSize: 'clamp(10px,1vw,13px)', fontWeight: 700, letterSpacing: '.3em', textTransform: 'uppercase', color: 'rgba(255,255,255,.5)' }}>
                Modifications
              </span>
              {upgrades.length > 0 && (
                <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 'clamp(13px,1.2vw,16px)', letterSpacing: '.1em', color: theme.p }}>
                  {upgrades.length} TOTAL
                </span>
              )}
            </div>
            {upgrades.length > 0 ? (
              <UpgradePair upgrades={upgrades} theme={theme} />
            ) : (
              <div className="empty-state">No modifications added</div>
            )}
          </div>

          <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,.07)', animation: 'fadeUp .7s ease 1.3s both' }}>
            <div style={{ fontFamily: "'Barlow',sans-serif", fontSize: 'clamp(10px,.95vw,12px)', fontWeight: 300, fontStyle: 'italic', lineHeight: 1.7, color: 'rgba(255,255,255,.35)' }}>
              Together we inspire others to achieve extraordinary excellence through belief, change, and progress.
            </div>
          </div>
        </div>
      </div>

      <GearMenu
        themeKey={themeKey}
        setThemeKey={handleThemeChange}
        onEdit={handleEditRequest}
        onManagePages={handleManagePages}
        user={user}
        onSignOut={handleSignOut}
        locationName={location?.name}
      />

      {showPageMgr && (
        <PageManager
          pages={pages}
          activePageId={location?.activePageId}
          onActivate={handleActivate}
          onEdit={handleEditPage}
          onCreate={handleCreatePage}
          onDelete={handleDeletePage}
          onDuplicate={handleDuplicate}
          theme={theme}
          onClose={() => setShowPageMgr(false)}
        />
      )}

      {editingPage && (
        <AdminPanel
          page={editingPage}
          locationId={locationId}
          onPreview={setPreview}
          onConfirm={handleConfirm}
          onRevert={handleRevert}
          theme={theme}
          manufacturers={manufacturers}
          models={models}
        />
      )}

      {toast && <div className="toast">{toast}</div>}
    </>
  );
}
