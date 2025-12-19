import { useRef, useCallback, useState, type ChangeEvent } from 'react';
import Webcam from 'react-webcam';
import { useApp } from '../store/AppContext';
import { resizeImage } from '../utils/imageProcessing';
import { v4 as uuidv4 } from 'uuid';
import type { Document, ScannedPage } from '../types';
import './Camera.css';

interface CameraProps {
  onCapture?: (imageData: string) => void;
  documentId?: string;
}

export function Camera({ onCapture, documentId }: CameraProps) {
  const webcamRef = useRef<Webcam>(null);
  const { state, dispatch } = useApp();
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [isCapturing, setIsCapturing] = useState(false);
  const [flash, setFlash] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const videoConstraints = {
    width: { ideal: 1920 },
    height: { ideal: 1080 },
    facingMode,
  };

  const capture = useCallback(async () => {
    if (!webcamRef.current) return;

    setIsCapturing(true);
    setFlash(true);

    const imageSrc = webcamRef.current.getScreenshot();
    if (imageSrc) {
      const resized = await resizeImage(imageSrc, 2000, 2000);
      await handleCapturedImage(resized);
    }

    setTimeout(() => {
      setFlash(false);
      setIsCapturing(false);
    }, 200);
  }, [documentId, state.currentDocument]);

  const handleCapturedImage = async (imageData: string) => {
    if (onCapture) {
      onCapture(imageData);
      return;
    }

    const page: ScannedPage = {
      id: uuidv4(),
      imageData,
      originalImage: imageData,
      filter: 'original',
      createdAt: new Date(),
      order: 0,
    };

    if (documentId || state.currentDocument) {
      const docId = documentId || state.currentDocument!.id;
      dispatch({
        type: 'ADD_PAGE_TO_DOCUMENT',
        payload: { documentId: docId, page },
      });
    } else {
      // Create new document
      const newDoc: Document = {
        id: uuidv4(),
        name: `Scan ${new Date().toLocaleDateString()}`,
        pages: [page],
        createdAt: new Date(),
        updatedAt: new Date(),
        thumbnail: imageData,
      };
      dispatch({ type: 'ADD_DOCUMENT', payload: newDoc });
      dispatch({ type: 'SET_CURRENT_DOCUMENT', payload: newDoc });
    }

    dispatch({ type: 'SET_CURRENT_PAGE', payload: page });
    dispatch({ type: 'SET_VIEW_MODE', payload: 'editor' });
  };

  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const imageData = e.target?.result as string;
      const resized = await resizeImage(imageData, 2000, 2000);
      await handleCapturedImage(resized);
    };
    reader.readAsDataURL(file);
  };

  const toggleCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  const goBack = () => {
    dispatch({ type: 'SET_VIEW_MODE', payload: 'gallery' });
  };

  return (
    <div className="camera-container">
      {flash && <div className="flash-overlay" />}

      <div className="camera-header">
        <button className="icon-btn" onClick={goBack}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="camera-title">Scanner</span>
        <button className="icon-btn" onClick={toggleCamera}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M16.5 9.5l-9 5M16.5 14.5l-9-5" />
            <circle cx="7.5" cy="12" r="2.5" />
            <circle cx="16.5" cy="7" r="2.5" />
            <circle cx="16.5" cy="17" r="2.5" />
          </svg>
        </button>
      </div>

      <div className="camera-view">
        <Webcam
          audio={false}
          ref={webcamRef}
          screenshotFormat="image/jpeg"
          videoConstraints={videoConstraints}
          className="webcam"
        />
        <div className="scan-guide">
          <div className="corner top-left" />
          <div className="corner top-right" />
          <div className="corner bottom-left" />
          <div className="corner bottom-right" />
        </div>
      </div>

      <div className="camera-controls">
        <button className="gallery-btn" onClick={() => fileInputRef.current?.click()}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
        </button>

        <button
          className={`capture-btn ${isCapturing ? 'capturing' : ''}`}
          onClick={capture}
          disabled={isCapturing}
        >
          <div className="capture-inner" />
        </button>

        <button className="batch-btn">
          <span>{state.currentDocument?.pages.length || 0}</span>
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden-input"
      />
    </div>
  );
}
