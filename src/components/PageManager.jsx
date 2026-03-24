import { useState, useEffect } from 'react';

export default function PageManager({
  pages, activePageId, onActivate, onEdit, onCreate,
  onDelete, onDuplicate, theme, onClose,
}) {
  const [closing, setClosing]           = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  // Escape to close
  useEffect(() => {
    const h = e => {
      if (e.key === 'Escape' && !closing) {
        setClosing(true);
        setTimeout(onClose, 280);
      }
    };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [closing, onClose]);

  const close = () => {
    setClosing(true);
    setTimeout(onClose, 280);
  };

  const handleDelete = pageId => {
    if (confirmDelete === pageId) {
      onDelete(pageId);
      setConfirmDelete(null);
    } else {
      setConfirmDelete(pageId);
    }
  };

  return (
    <div className="admin-overlay" onClick={e => e.target === e.currentTarget && close()}>
      <div className={`admin-panel${closing ? ' closing' : ''}`}>

        {/* Header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: 24, borderBottom: '1px solid rgba(255,255,255,.07)', paddingBottom: 14,
        }}>
          <div style={{
            fontFamily: "'Bebas Neue',sans-serif", fontSize: 24,
            letterSpacing: '.1em', color: theme.text,
          }}>
            Saved Pages
          </div>
          <button className="add-btn" style={{ margin: 0 }} onClick={() => { close(); setTimeout(onCreate, 300); }}>
            + New Page
          </button>
        </div>

        {/* Page list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {pages.length === 0 && (
            <div className="empty-state">No pages yet. Create your first welcome page.</div>
          )}

          {pages.map(p => {
            const isActive = p.id === activePageId;
            const names = (p.roamers || []).map(r => r.name).filter(Boolean).join(', ') || 'Unnamed';
            const date = p.createdAt?.toDate
              ? p.createdAt.toDate().toLocaleDateString()
              : '';

            return (
              <div key={p.id} style={{
                padding: '14px 16px',
                background: isActive ? `${theme.p}12` : 'rgba(255,255,255,.03)',
                border: `1px solid ${isActive ? theme.p + '44' : 'rgba(255,255,255,.08)'}`,
                transition: 'all .2s',
              }}>
                {/* Title row */}
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6,
                }}>
                  <div style={{
                    fontFamily: "'Barlow',sans-serif", fontSize: 13, fontWeight: 600,
                    color: theme.text, letterSpacing: '.02em',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70%',
                  }}>
                    {p.title || names}
                  </div>
                  {isActive && (
                    <span style={{
                      fontFamily: "'Barlow',sans-serif", fontSize: 9, fontWeight: 700,
                      letterSpacing: '.2em', textTransform: 'uppercase',
                      color: theme.p, padding: '3px 8px', border: `1px solid ${theme.p}44`,
                    }}>
                      LIVE
                    </span>
                  )}
                </div>

                {/* Subtitle: names if title exists */}
                {p.title && (
                  <div style={{
                    fontFamily: "'Barlow',sans-serif", fontSize: 11, fontWeight: 400,
                    color: 'rgba(255,255,255,.35)', marginBottom: 4,
                  }}>
                    {names}
                  </div>
                )}
                {date && (
                  <div style={{
                    fontFamily: "'Barlow',sans-serif", fontSize: 10,
                    color: 'rgba(255,255,255,.25)', marginBottom: 10,
                  }}>
                    {date}
                  </div>
                )}

                {/* Actions */}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {!isActive && (
                    <button className="add-btn" style={{ margin: 0, padding: '5px 12px', fontSize: 9 }}
                      onClick={() => onActivate(p.id)}>
                      Activate
                    </button>
                  )}
                  <button className="add-btn" style={{ margin: 0, padding: '5px 12px', fontSize: 9 }}
                    onClick={() => { close(); setTimeout(() => onEdit(p), 300); }}>
                    Edit
                  </button>
                  <button className="add-btn" style={{ margin: 0, padding: '5px 12px', fontSize: 9 }}
                    onClick={() => onDuplicate(p)}>
                    Duplicate
                  </button>
                  {!isActive && (
                    <button className="del-btn" style={{
                      width: 'auto', height: 'auto', padding: '5px 12px', fontSize: 9,
                      fontFamily: "'Barlow',sans-serif", fontWeight: 700,
                      letterSpacing: '.15em', textTransform: 'uppercase',
                    }} onClick={() => handleDelete(p.id)}>
                      {confirmDelete === p.id ? 'Confirm?' : 'Delete'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
