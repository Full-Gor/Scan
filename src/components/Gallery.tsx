import { useState } from 'react';
import { useApp } from '../store/AppContext';
import type { Document } from '../types';
import { downloadPDF, sharePDF } from '../utils/pdfGenerator';
import './Gallery.css';

export function Gallery() {
  const { state, dispatch } = useApp();
  const [selectedDocs, setSelectedDocs] = useState<Set<string>>(new Set());
  const [isSelecting, setIsSelecting] = useState(false);
  const [showMenu, setShowMenu] = useState<string | null>(null);

  const openCamera = () => {
    dispatch({ type: 'SET_CURRENT_DOCUMENT', payload: null });
    dispatch({ type: 'SET_VIEW_MODE', payload: 'camera' });
  };

  const openDocument = (doc: Document) => {
    if (isSelecting) {
      toggleSelect(doc.id);
    } else {
      dispatch({ type: 'SET_CURRENT_DOCUMENT', payload: doc });
      dispatch({ type: 'SET_VIEW_MODE', payload: 'document' });
    }
  };

  const toggleSelect = (docId: string) => {
    const newSelected = new Set(selectedDocs);
    if (newSelected.has(docId)) {
      newSelected.delete(docId);
    } else {
      newSelected.add(docId);
    }
    setSelectedDocs(newSelected);
    if (newSelected.size === 0) {
      setIsSelecting(false);
    }
  };

  const handleLongPress = (docId: string) => {
    setIsSelecting(true);
    setSelectedDocs(new Set([docId]));
  };

  const deleteSelected = () => {
    selectedDocs.forEach(docId => {
      dispatch({ type: 'DELETE_DOCUMENT', payload: docId });
    });
    setSelectedDocs(new Set());
    setIsSelecting(false);
  };

  const cancelSelection = () => {
    setSelectedDocs(new Set());
    setIsSelecting(false);
  };

  const handleDownload = async (doc: Document) => {
    setShowMenu(null);
    await downloadPDF(doc);
  };

  const handleShare = async (doc: Document) => {
    setShowMenu(null);
    await sharePDF(doc);
  };

  const handleDelete = (docId: string) => {
    setShowMenu(null);
    dispatch({ type: 'DELETE_DOCUMENT', payload: docId });
  };

  const renameDocument = (doc: Document) => {
    setShowMenu(null);
    const newName = prompt('Nouveau nom:', doc.name);
    if (newName && newName.trim()) {
      dispatch({
        type: 'UPDATE_DOCUMENT',
        payload: { ...doc, name: newName.trim() },
      });
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  if (state.isLoading) {
    return (
      <div className="gallery-loading">
        <div className="spinner" />
        <p>Chargement...</p>
      </div>
    );
  }

  return (
    <div className="gallery-container">
      <header className="gallery-header">
        {isSelecting ? (
          <>
            <button className="icon-btn" onClick={cancelSelection}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
            <span className="header-title">{selectedDocs.size} sélectionné(s)</span>
            <button className="icon-btn delete-btn" onClick={deleteSelected}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
            </button>
          </>
        ) : (
          <>
            <h1 className="header-title">Mes Documents</h1>
            <button className="icon-btn" onClick={() => setIsSelecting(true)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
              </svg>
            </button>
          </>
        )}
      </header>

      <div className="gallery-content">
        {state.documents.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
            </div>
            <h2>Aucun document</h2>
            <p>Scannez votre premier document pour commencer</p>
          </div>
        ) : (
          <div className="documents-grid">
            {state.documents.map(doc => (
              <div
                key={doc.id}
                className={`document-card ${selectedDocs.has(doc.id) ? 'selected' : ''}`}
                onClick={() => openDocument(doc)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  handleLongPress(doc.id);
                }}
              >
                {isSelecting && (
                  <div className="select-checkbox">
                    {selectedDocs.has(doc.id) && (
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                      </svg>
                    )}
                  </div>
                )}
                <div className="document-thumbnail">
                  {doc.thumbnail ? (
                    <img src={doc.thumbnail} alt={doc.name} />
                  ) : (
                    <div className="no-thumbnail">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                      </svg>
                    </div>
                  )}
                  <span className="page-count">{doc.pages.length} page(s)</span>
                </div>
                <div className="document-info">
                  <h3>{doc.name}</h3>
                  <p>{formatDate(doc.updatedAt)}</p>
                </div>
                {!isSelecting && (
                  <button
                    className="menu-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMenu(showMenu === doc.id ? null : doc.id);
                    }}
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <circle cx="12" cy="5" r="2" />
                      <circle cx="12" cy="12" r="2" />
                      <circle cx="12" cy="19" r="2" />
                    </svg>
                  </button>
                )}
                {showMenu === doc.id && (
                  <div className="context-menu">
                    <button onClick={() => renameDocument(doc)}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                      Renommer
                    </button>
                    <button onClick={() => handleDownload(doc)}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                      Télécharger PDF
                    </button>
                    <button onClick={() => handleShare(doc)}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="18" cy="5" r="3" />
                        <circle cx="6" cy="12" r="3" />
                        <circle cx="18" cy="19" r="3" />
                        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                      </svg>
                      Partager
                    </button>
                    <button className="delete" onClick={() => handleDelete(doc.id)}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                      Supprimer
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <button className="fab" onClick={openCamera}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
          <circle cx="12" cy="13" r="4" />
        </svg>
      </button>

      {showMenu && (
        <div className="menu-backdrop" onClick={() => setShowMenu(null)} />
      )}
    </div>
  );
}
