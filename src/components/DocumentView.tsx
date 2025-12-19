import { useState, type DragEvent } from 'react';
import { useApp } from '../store/AppContext';
import { downloadPDF, sharePDF } from '../utils/pdfGenerator';
import type { ScannedPage } from '../types';
import './DocumentView.css';

export function DocumentView() {
  const { state, dispatch } = useApp();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [draggedPage, setDraggedPage] = useState<string | null>(null);

  const document = state.currentDocument;

  if (!document) {
    return null;
  }

  const goBack = () => {
    dispatch({ type: 'SET_CURRENT_DOCUMENT', payload: null });
    dispatch({ type: 'SET_VIEW_MODE', payload: 'gallery' });
  };

  const openCamera = () => {
    dispatch({ type: 'SET_VIEW_MODE', payload: 'camera' });
  };

  const editPage = (page: ScannedPage) => {
    dispatch({ type: 'SET_CURRENT_PAGE', payload: page });
    dispatch({ type: 'SET_VIEW_MODE', payload: 'editor' });
  };

  const deletePage = (pageId: string) => {
    if (document.pages.length === 1) {
      // If it's the last page, delete the whole document
      dispatch({ type: 'DELETE_DOCUMENT', payload: document.id });
      dispatch({ type: 'SET_VIEW_MODE', payload: 'gallery' });
    } else {
      dispatch({
        type: 'DELETE_PAGE',
        payload: { documentId: document.id, pageId },
      });
    }
  };

  const handleDownload = async () => {
    setIsMenuOpen(false);
    await downloadPDF(document);
  };

  const handleShare = async () => {
    setIsMenuOpen(false);
    await sharePDF(document);
  };

  const handleRename = () => {
    setIsMenuOpen(false);
    const newName = prompt('Nouveau nom:', document.name);
    if (newName && newName.trim()) {
      dispatch({
        type: 'UPDATE_DOCUMENT',
        payload: { ...document, name: newName.trim() },
      });
    }
  };

  const handleDelete = () => {
    setIsMenuOpen(false);
    if (confirm('Supprimer ce document ?')) {
      dispatch({ type: 'DELETE_DOCUMENT', payload: document.id });
      dispatch({ type: 'SET_VIEW_MODE', payload: 'gallery' });
    }
  };

  const handleDragStart = (pageId: string) => {
    setDraggedPage(pageId);
  };

  const handleDragOver = (e: DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedPage || draggedPage === targetId) return;

    const pages = [...document.pages];
    const draggedIndex = pages.findIndex(p => p.id === draggedPage);
    const targetIndex = pages.findIndex(p => p.id === targetId);

    if (draggedIndex !== -1 && targetIndex !== -1) {
      const [removed] = pages.splice(draggedIndex, 1);
      pages.splice(targetIndex, 0, removed);

      dispatch({
        type: 'UPDATE_DOCUMENT',
        payload: { ...document, pages },
      });
    }
  };

  const handleDragEnd = () => {
    setDraggedPage(null);
  };

  return (
    <div className="document-view-container">
      <header className="document-header">
        <button className="icon-btn" onClick={goBack}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="document-title-area">
          <h1>{document.name}</h1>
          <span>{document.pages.length} page(s)</span>
        </div>
        <button className="icon-btn" onClick={() => setIsMenuOpen(!isMenuOpen)}>
          <svg viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="5" r="2" />
            <circle cx="12" cy="12" r="2" />
            <circle cx="12" cy="19" r="2" />
          </svg>
        </button>
      </header>

      {isMenuOpen && (
        <>
          <div className="menu-backdrop" onClick={() => setIsMenuOpen(false)} />
          <div className="dropdown-menu">
            <button onClick={handleRename}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              Renommer
            </button>
            <button onClick={handleDownload}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Télécharger PDF
            </button>
            <button onClick={handleShare}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
              Partager
            </button>
            <button className="delete" onClick={handleDelete}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
              Supprimer
            </button>
          </div>
        </>
      )}

      <div className="pages-list">
        {document.pages.map((page, index) => (
          <div
            key={page.id}
            className={`page-item ${draggedPage === page.id ? 'dragging' : ''}`}
            draggable
            onDragStart={() => handleDragStart(page.id)}
            onDragOver={(e) => handleDragOver(e, page.id)}
            onDragEnd={handleDragEnd}
          >
            <div className="page-number">{index + 1}</div>
            <div className="page-thumbnail" onClick={() => editPage(page)}>
              <img src={page.imageData} alt={`Page ${index + 1}`} />
            </div>
            <div className="page-actions">
              <button className="page-action-btn" onClick={() => editPage(page)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </button>
              <button className="page-action-btn delete" onClick={() => deletePage(page.id)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
              </button>
            </div>
            <div className="drag-handle">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <circle cx="9" cy="5" r="1.5" />
                <circle cx="15" cy="5" r="1.5" />
                <circle cx="9" cy="12" r="1.5" />
                <circle cx="15" cy="12" r="1.5" />
                <circle cx="9" cy="19" r="1.5" />
                <circle cx="15" cy="19" r="1.5" />
              </svg>
            </div>
          </div>
        ))}
      </div>

      <div className="document-footer">
        <button className="add-page-btn" onClick={openCamera}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Ajouter une page
        </button>
        <button className="export-btn" onClick={handleDownload}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
          Exporter PDF
        </button>
      </div>
    </div>
  );
}
