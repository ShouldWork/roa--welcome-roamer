import { useState, useEffect, useRef } from 'react';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { storage, db } from '../firebase.js';
import mdcLogo from '../assets/mdc-logo.png';

const MFG_PRESETS = [
  { label: 'MDC', logo: mdcLogo },
];

const nid = () => crypto.randomUUID();

export default function AdminPanel({ page, locationId, onPreview, onConfirm, onRevert, theme, manufacturers, models }) {
  const [closing, setClosing] = useState(false);
  const [local, setLocal]     = useState(() => {
    const { id, createdAt, updatedAt, ...rest } = page;
    return JSON.parse(JSON.stringify(rest));
  });
  const [uploading, setUploading]       = useState(false);
  const [uploadingBg, setUploadingBg]   = useState(false);
  const [logoTab, setLogoTab]           = useState('preset');
  const [bgTab, setBgTab]              = useState('gallery');
  const [errors, setErrors]             = useState({});
  const fileRef   = useRef(null);
  const bgFileRef = useRef(null);

  useEffect(() => {
    document.documentElement.style.setProperty('--p', theme.p);
  }, [theme.p]);

  // Live preview
  useEffect(() => {
    const t = setTimeout(() => onPreview(local), 120);
    return () => clearTimeout(t);
  }, [local, onPreview]);

  // Escape to close
  useEffect(() => {
    const h = e => {
      if (e.key === 'Escape' && !closing) {
        setClosing(true);
        setTimeout(() => onRevert(), 280);
      }
    };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [closing, onRevert]);

  const close = (save = false) => {
    if (save) {
      const errs = {};
      if (local.roamers.some(r => !r.name.trim())) errs.roamers = true;
      if (Object.keys(errs).length > 0) { setErrors(errs); return; }
      setClosing(true);
      setTimeout(() => onConfirm(), 280);
    } else {
      setClosing(true);
      setTimeout(() => onRevert(), 280);
    }
  };

  // Roamers
  const setRoamer = (id, name) => {
    setLocal(p => ({ ...p, roamers: p.roamers.map(r => r.id === id ? { ...r, name } : r) }));
    setErrors(e => ({ ...e, roamers: false }));
  };
  const addRoamer = () =>
    setLocal(p => ({ ...p, roamers: [...p.roamers, { id: nid(), name: '' }] }));
  const delRoamer = id =>
    setLocal(p => ({ ...p, roamers: p.roamers.filter(r => r.id !== id) }));

  // Upgrades
  const setUpgrade = (id, text) =>
    setLocal(p => ({ ...p, upgrades: p.upgrades.map(u => u.id === id ? { ...u, text } : u) }));
  const addUpgrade = () =>
    setLocal(p => ({ ...p, upgrades: [...p.upgrades, { id: nid(), text: '' }] }));
  const delUpgrade = id =>
    setLocal(p => ({ ...p, upgrades: p.upgrades.filter(u => u.id !== id) }));

  // Manufacturer selection
  const selectMfg = mfgId => {
    const mfg = manufacturers.find(m => m.id === mfgId);
    setLocal(p => ({ ...p, manufacturerId: mfgId, modelId: '', mfgLogoUrl: mfg?.logoUrl || '', bgImageUrl: '' }));
  };

  // Model selection — auto-fill bg from model images or defaultImageUrl
  const selectModel = modelId => {
    const model = models.find(m => m.id === modelId);
    const bgUrl = model?.images?.[0] || model?.defaultImageUrl || '';
    setLocal(p => ({ ...p, modelId, bgImageUrl: bgUrl }));
    setBgTab('gallery');
  };

  // Logo upload
  const handleLogoUpload = async e => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert('Image must be under 5 MB'); return; }
    setUploading(true);
    try {
      const path = locationId
        ? `locations/${locationId}/logos/${Date.now()}_${file.name}`
        : `logos/${Date.now()}_${file.name}`;
      const snap = await uploadBytes(storageRef(storage, path), file);
      const url  = await getDownloadURL(snap.ref);
      setLocal(p => ({ ...p, mfgLogoUrl: url }));
    } catch (err) {
      console.error('Logo upload failed:', err);
      alert('Upload failed. Please try again.');
    } finally { setUploading(false); }
  };

  // Background image upload — saves to model's images array in Firestore
  const handleBgUpload = async e => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { alert('Image must be under 10 MB'); return; }
    if (!local.modelId) { alert('Select a trailer model first'); return; }
    setUploadingBg(true);
    try {
      const path = `models/${local.modelId}/backgrounds/${Date.now()}_${file.name}`;
      const snap = await uploadBytes(storageRef(storage, path), file);
      const url  = await getDownloadURL(snap.ref);
      // Add to model's images array in Firestore
      await updateDoc(doc(db, 'models', local.modelId), {
        images: arrayUnion(url),
      });
      // Set as current bg
      setLocal(p => ({ ...p, bgImageUrl: url }));
    } catch (err) {
      console.error('Background upload failed:', err);
      alert('Upload failed. Please try again.');
    } finally { setUploadingBg(false); }
  };

  const mfgModels   = models.filter(m => m.manufacturerId === local.manufacturerId);
  const selectedMfg = manufacturers.find(m => m.id === local.manufacturerId);
  const selectedModel = models.find(m => m.id === local.modelId);
  const baseImages = selectedModel?.images || [];
  // Include defaultImageUrl if it exists and isn't already in images
  const modelImages = (selectedModel?.defaultImageUrl && !baseImages.includes(selectedModel.defaultImageUrl))
    ? [selectedModel.defaultImageUrl, ...baseImages]
    : [...baseImages];
  const isNew = !page.id;

  return (
    <div className="admin-overlay" onClick={e => e.target === e.currentTarget && close(false)}>
      <div className={`admin-panel${closing ? ' closing' : ''}`}>
        <div className="admin-title" style={{ color: theme.text }}>
          {isNew ? 'New Page' : 'Edit Page'}
        </div>

        <div className="admin-grid">

          {/* Page Title */}
          <div>
            <div className="admin-label">Page Title</div>
            <input className="admin-input"
              value={local.title || ''} placeholder="e.g. Smith Family — March 25" maxLength={80}
              onChange={e => setLocal(p => ({ ...p, title: e.target.value }))}
            />
          </div>

          {/* Roamers */}
          <div>
            <div className="admin-label" style={errors.roamers ? { color: 'rgba(220,80,80,.8)' } : {}}>
              Roamer Name(s) {errors.roamers && '— name required'}
            </div>
            {local.roamers.map(r => (
              <div key={r.id} className="admin-row">
                <input className={`admin-input${errors.roamers && !r.name.trim() ? ' invalid' : ''}`}
                  value={r.name} placeholder="Full name" maxLength={60}
                  onChange={e => setRoamer(r.id, e.target.value)}
                />
                {local.roamers.length > 1 && (
                  <button className="del-btn" onClick={() => delRoamer(r.id)}>✕</button>
                )}
              </div>
            ))}
            <button className="add-btn" onClick={addRoamer}>+ Add Roamer</button>
          </div>

          {/* Dealer */}
          <div>
            <div className="admin-label">Dealer / Location</div>
            <input className="admin-input"
              value={local.dealer || ''} placeholder="e.g. ROA Off-Road — Phoenix" maxLength={80}
              onChange={e => setLocal(p => ({ ...p, dealer: e.target.value }))}
            />
          </div>

          {/* First Adventure */}
          <div>
            <div className="admin-label">First Adventure</div>
            <input className="admin-input"
              value={local.firstAdventure || ''} placeholder="e.g. Moab, Utah — Canyonlands Overlook" maxLength={120}
              onChange={e => setLocal(p => ({ ...p, firstAdventure: e.target.value }))}
            />
          </div>

          {/* Manufacturer */}
          <div>
            <div className="admin-label">Manufacturer</div>
            {manufacturers.length > 0 ? (
              <select className="admin-input" value={local.manufacturerId || ''} onChange={e => selectMfg(e.target.value)}>
                <option value="">— Select —</option>
                {manufacturers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            ) : (
              <div style={{ color: 'rgba(255,255,255,.4)', fontSize: 12, fontFamily: "'Barlow',sans-serif", padding: '9px 0' }}>
                No manufacturers in catalog yet.
              </div>
            )}
          </div>

          {/* Model */}
          <div>
            <div className="admin-label">Trailer Model</div>
            {mfgModels.length > 0 ? (
              <select className="admin-input" value={local.modelId || ''} onChange={e => selectModel(e.target.value)}>
                <option value="">— Select —</option>
                {mfgModels.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            ) : (
              <input className="admin-input" value={local.modelId || ''}
                placeholder={local.manufacturerId ? 'No models found' : 'Select manufacturer first'} readOnly
              />
            )}
          </div>

          {/* Manufacturer Logo — tabbed */}
          <div>
            <div className="admin-label">Manufacturer Logo</div>
            <div className="logo-tabs">
              <button className={`logo-tab${logoTab === 'preset' ? ' active' : ''}`} onClick={() => setLogoTab('preset')}>Preset</button>
              <button className={`logo-tab${logoTab === 'url' ? ' active' : ''}`} onClick={() => setLogoTab('url')}>URL</button>
              <button className={`logo-tab${logoTab === 'upload' ? ' active' : ''}`} onClick={() => setLogoTab('upload')}>Upload</button>
            </div>
            {logoTab === 'preset' && (
              <div className="mfg-presets">
                {MFG_PRESETS.map(p => (
                  <button key={p.label}
                    className={`mfg-preset-btn${local.mfgLogoUrl === p.logo ? ' active' : ''}`}
                    onClick={() => setLocal(prev => ({ ...prev, mfgLogoUrl: p.logo }))}
                  >{p.label}</button>
                ))}
                {selectedMfg?.logoUrl && (
                  <button className={`mfg-preset-btn${local.mfgLogoUrl === selectedMfg.logoUrl ? ' active' : ''}`}
                    onClick={() => setLocal(prev => ({ ...prev, mfgLogoUrl: selectedMfg.logoUrl }))}
                  >From Catalog</button>
                )}
              </div>
            )}
            {logoTab === 'url' && (
              <input className="admin-input"
                value={local.mfgLogoUrl && !local.mfgLogoUrl.startsWith('data:') ? local.mfgLogoUrl : ''}
                placeholder="Enter logo URL"
                onChange={e => setLocal(p => ({ ...p, mfgLogoUrl: e.target.value }))}
              />
            )}
            {logoTab === 'upload' && (
              <div>
                <button className="add-btn" onClick={() => fileRef.current?.click()} disabled={uploading}>
                  {uploading ? 'Uploading…' : '↑ Upload Image'}
                </button>
                <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleLogoUpload} />
                <div style={{ marginTop: 6, fontFamily: "'Barlow',sans-serif", fontSize: 10, color: 'rgba(255,255,255,.3)', letterSpacing: '.05em' }}>
                  Max 5 MB. PNG or SVG recommended.
                </div>
              </div>
            )}
            {local.mfgLogoUrl && (
              <div className="logo-preview">
                <img src={local.mfgLogoUrl} alt="Logo preview" />
              </div>
            )}
          </div>

          {/* ═══ Background Image — Gallery / Upload / URL ═══ */}
          <div>
            <div className="admin-label">Background Image</div>
            <div className="logo-tabs">
              <button className={`logo-tab${bgTab === 'gallery' ? ' active' : ''}`} onClick={() => setBgTab('gallery')}>Gallery</button>
              <button className={`logo-tab${bgTab === 'upload' ? ' active' : ''}`} onClick={() => setBgTab('upload')}>Upload</button>
              <button className={`logo-tab${bgTab === 'url' ? ' active' : ''}`} onClick={() => setBgTab('url')}>URL</button>
            </div>

            {/* Gallery tab */}
            {bgTab === 'gallery' && (
              <div>
                {!local.modelId && (
                  <div style={{ color: 'rgba(255,255,255,.3)', fontSize: 11, fontFamily: "'Barlow',sans-serif", padding: '12px 0', fontStyle: 'italic' }}>
                    Select a trailer model to see its image gallery.
                  </div>
                )}
                {local.modelId && modelImages.length === 0 && (
                  <div style={{ color: 'rgba(255,255,255,.3)', fontSize: 11, fontFamily: "'Barlow',sans-serif", padding: '12px 0', fontStyle: 'italic' }}>
                    No images for this model yet. Upload one to get started.
                  </div>
                )}
                {modelImages.length > 0 && (
                  <div style={{
                    display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6,
                    maxHeight: 200, overflowY: 'auto',
                  }}>
                    {modelImages.map((url, i) => (
                      <button key={i} onClick={() => setLocal(p => ({ ...p, bgImageUrl: url }))} style={{
                        position: 'relative', aspectRatio: '16/10', cursor: 'pointer',
                        border: local.bgImageUrl === url ? `2px solid ${theme.p}` : '2px solid rgba(255,255,255,.08)',
                        background: 'rgba(255,255,255,.03)', padding: 0, overflow: 'hidden',
                        transition: 'border-color .2s',
                      }}>
                        <img src={url} alt={`Model image ${i + 1}`} style={{
                          width: '100%', height: '100%', objectFit: 'cover',
                        }} />
                        {local.bgImageUrl === url && (
                          <div style={{
                            position: 'absolute', top: 3, right: 3,
                            background: theme.p, color: '#fff',
                            fontSize: 8, fontWeight: 700, padding: '2px 5px',
                            fontFamily: "'Barlow',sans-serif", letterSpacing: '.1em',
                          }}>
                            ACTIVE
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Upload tab */}
            {bgTab === 'upload' && (
              <div>
                <button className="add-btn" onClick={() => bgFileRef.current?.click()} disabled={uploadingBg || !local.modelId}>
                  {uploadingBg ? 'Uploading…' : '↑ Upload Background'}
                </button>
                <input ref={bgFileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleBgUpload} />
                <div style={{ marginTop: 6, fontFamily: "'Barlow',sans-serif", fontSize: 10, color: 'rgba(255,255,255,.3)', letterSpacing: '.05em' }}>
                  {local.modelId
                    ? 'Max 10 MB. Image will be saved to this model\'s gallery for all locations.'
                    : 'Select a trailer model first to upload.'}
                </div>
              </div>
            )}

            {/* URL tab */}
            {bgTab === 'url' && (
              <div>
                <input className="admin-input"
                  value={local.bgImageUrl || ''} placeholder="Enter image URL"
                  onChange={e => setLocal(p => ({ ...p, bgImageUrl: e.target.value }))}
                />
                <div style={{ marginTop: 6, fontFamily: "'Barlow',sans-serif", fontSize: 10, color: 'rgba(255,255,255,.3)', letterSpacing: '.05em' }}>
                  Paste a direct image URL. This won't be saved to the model gallery.
                </div>
              </div>
            )}

            {/* Current bg preview */}
            {local.bgImageUrl && (
              <div style={{
                marginTop: 8, height: 80, overflow: 'hidden',
                border: '1px solid rgba(255,255,255,.08)', background: 'rgba(255,255,255,.03)',
              }}>
                <img src={local.bgImageUrl} alt="Background preview" style={{
                  width: '100%', height: '100%', objectFit: 'cover',
                }} />
              </div>
            )}
          </div>

          {/* Upgrades / Modifications */}
          <div>
            <div className="admin-label">Modifications / Upgrades</div>
            {local.upgrades.map(u => (
              <div key={u.id} className="admin-row">
                <input className="admin-input"
                  value={u.text} placeholder="e.g. 400W Upgraded Solar Array" maxLength={100}
                  onChange={e => setUpgrade(u.id, e.target.value)}
                />
                <button className="del-btn" onClick={() => delUpgrade(u.id)}>✕</button>
              </div>
            ))}
            <button className="add-btn" onClick={addUpgrade}>+ Add Modification</button>
          </div>

        </div>

        <div className="admin-actions">
          <button className="btn-cancel" onClick={() => close(false)} disabled={uploading || uploadingBg}>Revert</button>
          <button className="btn-apply" onClick={() => close(true)} disabled={uploading || uploadingBg}>
            {(uploading || uploadingBg) ? 'Uploading…' : isNew ? 'Create' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}
