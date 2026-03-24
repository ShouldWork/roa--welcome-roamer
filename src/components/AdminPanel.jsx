import { useState, useEffect, useRef } from 'react';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase.js';
import roaLogo from '../assets/roa-logo.png';
import mdcLogo from '../assets/mdc-logo.png';

const MFG_PRESETS = [
  { label: 'MDC', logo: mdcLogo },
];

let _nid = 8000;
const nid = () => ++_nid;

export default function AdminPanel({ delivery, setDelivery, theme, manufacturers, models, onClose }) {
  const [closing, setClosing] = useState(false);
  const [local, setLocal]     = useState(() => JSON.parse(JSON.stringify(delivery)));
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    document.documentElement.style.setProperty('--p', theme.p);
  }, [theme.p]);

  const close = (save = false) => {
    if (save) setDelivery(local);
    setClosing(true);
    setTimeout(onClose, 280);
  };

  // Roamers
  const setRoamer = (id, name) =>
    setLocal(p => ({ ...p, roamers: p.roamers.map(r => r.id === id ? { ...r, name } : r) }));
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

  // Manufacturer selection — auto-fills logo
  const selectMfg = mfgId => {
    const mfg = manufacturers.find(m => m.id === mfgId);
    setLocal(p => ({
      ...p,
      manufacturerId: mfgId,
      modelId: '',
      mfgLogoUrl: mfg?.logoUrl || '',
    }));
  };

  // Model selection — auto-fills background image
  const selectModel = modelId => {
    const model = models.find(m => m.id === modelId);
    setLocal(p => ({
      ...p,
      modelId,
      bgImageUrl: model?.defaultImageUrl || '',
    }));
  };

  // Logo file upload to Firebase Storage
  const handleLogoUpload = async e => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const path = `logos/${Date.now()}_${file.name}`;
      const snap = await uploadBytes(storageRef(storage, path), file);
      const url  = await getDownloadURL(snap.ref);
      setLocal(p => ({ ...p, mfgLogoUrl: url }));
    } finally {
      setUploading(false);
    }
  };

  const mfgModels = models.filter(m => m.manufacturerId === local.manufacturerId);
  const selectedMfg = manufacturers.find(m => m.id === local.manufacturerId);

  return (
    <div className="admin-overlay" onClick={e => e.target === e.currentTarget && close(false)}>
      <div className={`admin-panel${closing ? ' closing' : ''}`}>
        <div className="admin-title" style={{ color: theme.text }}>Edit Display</div>

        <div className="admin-grid">

          {/* Roamers */}
          <div className="admin-full">
            <div className="admin-label">Roamer Name(s)</div>
            {local.roamers.map(r => (
              <div key={r.id} className="admin-row">
                <input
                  className="admin-input"
                  value={r.name}
                  placeholder="Full name"
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
            <input
              className="admin-input"
              value={local.dealer || ''}
              placeholder="e.g. ROA Off-Road — Phoenix"
              onChange={e => setLocal(p => ({ ...p, dealer: e.target.value }))}
            />
          </div>

          {/* First Adventure */}
          <div>
            <div className="admin-label">First Adventure</div>
            <input
              className="admin-input"
              value={local.firstAdventure || ''}
              placeholder="e.g. Moab, Utah — Canyonlands Overlook"
              onChange={e => setLocal(p => ({ ...p, firstAdventure: e.target.value }))}
            />
          </div>

          {/* Manufacturer */}
          <div>
            <div className="admin-label">Manufacturer</div>
            {manufacturers.length > 0 ? (
              <select
                className="admin-input"
                value={local.manufacturerId || ''}
                onChange={e => selectMfg(e.target.value)}
              >
                <option value="">— Select manufacturer —</option>
                {manufacturers.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            ) : (
              <div style={{ color: 'rgba(255,255,255,.3)', fontSize: 12, fontFamily: "'Barlow',sans-serif", padding: '9px 0' }}>
                No manufacturers in catalog yet. Add via seed script.
              </div>
            )}
          </div>

          {/* Model */}
          <div>
            <div className="admin-label">Trailer Model</div>
            {mfgModels.length > 0 ? (
              <select
                className="admin-input"
                value={local.modelId || ''}
                onChange={e => selectModel(e.target.value)}
              >
                <option value="">— Select model —</option>
                {mfgModels.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            ) : (
              <input
                className="admin-input"
                value={local.modelId || ''}
                placeholder={local.manufacturerId ? 'No models for this manufacturer' : 'Select manufacturer first'}
                readOnly
              />
            )}
          </div>

          {/* Manufacturer Logo */}
          <div>
            <div className="admin-label">Manufacturer Logo</div>
            <div className="mfg-presets">
              {MFG_PRESETS.map(p => (
                <button
                  key={p.label}
                  className={`mfg-preset-btn${local.mfgLogoUrl === p.logo ? ' active' : ''}`}
                  onClick={() => setLocal(prev => ({ ...prev, mfgLogoUrl: p.logo }))}
                >
                  {p.label}
                </button>
              ))}
              {selectedMfg?.logoUrl && (
                <button
                  className={`mfg-preset-btn${local.mfgLogoUrl === selectedMfg.logoUrl ? ' active' : ''}`}
                  onClick={() => setLocal(prev => ({ ...prev, mfgLogoUrl: selectedMfg.logoUrl }))}
                >
                  From Catalog
                </button>
              )}
            </div>
            <input
              className="admin-input"
              value={local.mfgLogoUrl && !local.mfgLogoUrl.startsWith('data:') ? local.mfgLogoUrl : ''}
              placeholder="Logo URL or upload below"
              onChange={e => setLocal(p => ({ ...p, mfgLogoUrl: e.target.value }))}
            />
            <div style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
              <button className="add-btn" onClick={() => fileRef.current?.click()} disabled={uploading}>
                {uploading ? 'Uploading…' : '↑ Upload Image'}
              </button>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleLogoUpload} />
            </div>
            {local.mfgLogoUrl && (
              <div className="logo-preview">
                <img src={local.mfgLogoUrl} alt="Logo preview" />
              </div>
            )}
          </div>

          {/* Background Image URL */}
          <div>
            <div className="admin-label">Background Image URL</div>
            <input
              className="admin-input"
              value={local.bgImageUrl || ''}
              placeholder="Auto-filled from model or enter URL"
              onChange={e => setLocal(p => ({ ...p, bgImageUrl: e.target.value }))}
            />
            <div style={{ marginTop: 6, fontFamily: "'Barlow',sans-serif", fontSize: 10, color: 'rgba(255,255,255,.25)', letterSpacing: '.05em' }}>
              Selecting a model auto-fills this from the catalog.
            </div>
          </div>

          {/* Upgrades / Modifications */}
          <div className="admin-full">
            <div className="admin-label">Modifications / Upgrades</div>
            {local.upgrades.map(u => (
              <div key={u.id} className="admin-row">
                <input
                  className="admin-input"
                  value={u.text}
                  placeholder="e.g. 400W Upgraded Solar Array"
                  onChange={e => setUpgrade(u.id, e.target.value)}
                />
                <button className="del-btn" onClick={() => delUpgrade(u.id)}>✕</button>
              </div>
            ))}
            <button className="add-btn" onClick={addUpgrade}>+ Add Modification</button>
          </div>

        </div>

        <div className="admin-actions">
          <button className="btn-cancel" onClick={() => close(false)}>Cancel</button>
          <button className="btn-apply" onClick={() => close(true)}>Apply</button>
        </div>
      </div>
    </div>
  );
}
