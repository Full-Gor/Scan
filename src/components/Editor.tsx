import { useState, useEffect } from 'react';
import { useApp } from '../store/AppContext';
import type { FilterType } from '../types';
import { applyFilter, rotateImage } from '../utils/imageProcessing';
import './Editor.css';

const FILTERS: { type: FilterType; label: string }[] = [
  { type: 'original', label: 'Original' },
  { type: 'magic', label: 'Magic' },
  { type: 'grayscale', label: 'Gris' },
  { type: 'blackwhite', label: 'N&B' },
  { type: 'color', label: 'Couleur' },
];

export function Editor() {
  const { state, dispatch } = useApp();
  const [currentFilter, setCurrentFilter] = useState<FilterType>('original');
  const [previewImage, setPreviewImage] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [filterPreviews, setFilterPreviews] = useState<Record<FilterType, string>>({} as Record<FilterType, string>);

  const currentPage = state.currentPage;
  const currentDocument = state.currentDocument;

  useEffect(() => {
    if (currentPage) {
      setCurrentFilter(currentPage.filter);
      setPreviewImage(currentPage.imageData);
      generateFilterPreviews(currentPage.originalImage);
    }
  }, [currentPage]);

  const generateFilterPreviews = async (originalImage: string) => {
    const previews: Partial<Record<FilterType, string>> = {};
    for (const filter of FILTERS) {
      const preview = await applyFilter(originalImage, filter.type);
      previews[filter.type] = preview;
    }
    setFilterPreviews(previews as Record<FilterType, string>);
  };

  const handleFilterChange = async (filter: FilterType) => {
    if (!currentPage || !currentDocument || isProcessing) return;

    setIsProcessing(true);
    setCurrentFilter(filter);

    const newImageData = await applyFilter(currentPage.originalImage, filter);
    setPreviewImage(newImageData);

    const updatedPage = {
      ...currentPage,
      imageData: newImageData,
      filter,
    };

    dispatch({
      type: 'UPDATE_PAGE',
      payload: { documentId: currentDocument.id, page: updatedPage },
    });

    dispatch({ type: 'SET_CURRENT_PAGE', payload: updatedPage });
    setIsProcessing(false);
  };

  const handleRotate = async () => {
    if (!currentPage || !currentDocument || isProcessing) return;

    setIsProcessing(true);

    const rotatedOriginal = await rotateImage(currentPage.originalImage, 90);
    const rotatedImage = await rotateImage(previewImage, 90);

    setPreviewImage(rotatedImage);

    const updatedPage = {
      ...currentPage,
      originalImage: rotatedOriginal,
      imageData: rotatedImage,
    };

    dispatch({
      type: 'UPDATE_PAGE',
      payload: { documentId: currentDocument.id, page: updatedPage },
    });

    dispatch({ type: 'SET_CURRENT_PAGE', payload: updatedPage });
    generateFilterPreviews(rotatedOriginal);
    setIsProcessing(false);
  };

  const handleDone = () => {
    dispatch({ type: 'SET_VIEW_MODE', payload: 'document' });
  };

  const handleRetake = () => {
    dispatch({ type: 'SET_VIEW_MODE', payload: 'camera' });
  };

  const handleAddMore = () => {
    dispatch({ type: 'SET_VIEW_MODE', payload: 'camera' });
  };

  if (!currentPage) {
    return null;
  }

  return (
    <div className="editor-container">
      <header className="editor-header">
        <button className="text-btn" onClick={handleRetake}>
          Reprendre
        </button>
        <span className="editor-title">Modifier</span>
        <button className="text-btn primary" onClick={handleDone}>
          Terminer
        </button>
      </header>

      <div className="editor-preview">
        {isProcessing && (
          <div className="processing-overlay">
            <div className="spinner" />
          </div>
        )}
        <img src={previewImage} alt="Preview" />
      </div>

      <div className="editor-tools">
        <button className="tool-btn" onClick={handleRotate} disabled={isProcessing}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M23 4v6h-6" />
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
          </svg>
          <span>Rotation</span>
        </button>
      </div>

      <div className="filter-section">
        <h3>Filtres</h3>
        <div className="filter-list">
          {FILTERS.map(filter => (
            <button
              key={filter.type}
              className={`filter-btn ${currentFilter === filter.type ? 'active' : ''}`}
              onClick={() => handleFilterChange(filter.type)}
              disabled={isProcessing}
            >
              <div className="filter-preview">
                {filterPreviews[filter.type] ? (
                  <img src={filterPreviews[filter.type]} alt={filter.label} />
                ) : (
                  <div className="filter-loading" />
                )}
              </div>
              <span>{filter.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="editor-actions">
        <button className="action-btn" onClick={handleAddMore}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Ajouter page
        </button>
      </div>
    </div>
  );
}
