import { createContext, useContext, useReducer, useEffect, type ReactNode, type Dispatch } from 'react';
import type { Document, ScannedPage, ViewMode, FilterType } from '../types';
import { loadDocuments, saveDocuments } from '../utils/storage';

interface AppState {
  documents: Document[];
  currentDocument: Document | null;
  currentPage: ScannedPage | null;
  viewMode: ViewMode;
  isLoading: boolean;
}

type AppAction =
  | { type: 'SET_DOCUMENTS'; payload: Document[] }
  | { type: 'ADD_DOCUMENT'; payload: Document }
  | { type: 'UPDATE_DOCUMENT'; payload: Document }
  | { type: 'DELETE_DOCUMENT'; payload: string }
  | { type: 'SET_CURRENT_DOCUMENT'; payload: Document | null }
  | { type: 'SET_CURRENT_PAGE'; payload: ScannedPage | null }
  | { type: 'ADD_PAGE_TO_DOCUMENT'; payload: { documentId: string; page: ScannedPage } }
  | { type: 'UPDATE_PAGE'; payload: { documentId: string; page: ScannedPage } }
  | { type: 'DELETE_PAGE'; payload: { documentId: string; pageId: string } }
  | { type: 'SET_VIEW_MODE'; payload: ViewMode }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'APPLY_FILTER'; payload: { documentId: string; pageId: string; filter: FilterType } };

const initialState: AppState = {
  documents: [],
  currentDocument: null,
  currentPage: null,
  viewMode: 'gallery',
  isLoading: true,
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_DOCUMENTS':
      return { ...state, documents: action.payload, isLoading: false };

    case 'ADD_DOCUMENT':
      return { ...state, documents: [...state.documents, action.payload] };

    case 'UPDATE_DOCUMENT':
      return {
        ...state,
        documents: state.documents.map(doc =>
          doc.id === action.payload.id ? action.payload : doc
        ),
        currentDocument: state.currentDocument?.id === action.payload.id
          ? action.payload
          : state.currentDocument,
      };

    case 'DELETE_DOCUMENT':
      return {
        ...state,
        documents: state.documents.filter(doc => doc.id !== action.payload),
        currentDocument: state.currentDocument?.id === action.payload
          ? null
          : state.currentDocument,
      };

    case 'SET_CURRENT_DOCUMENT':
      return { ...state, currentDocument: action.payload };

    case 'SET_CURRENT_PAGE':
      return { ...state, currentPage: action.payload };

    case 'ADD_PAGE_TO_DOCUMENT': {
      const updatedDocs = state.documents.map(doc => {
        if (doc.id === action.payload.documentId) {
          return {
            ...doc,
            pages: [...doc.pages, action.payload.page],
            updatedAt: new Date(),
            thumbnail: doc.thumbnail || action.payload.page.imageData,
          };
        }
        return doc;
      });
      const updatedCurrentDoc = state.currentDocument?.id === action.payload.documentId
        ? updatedDocs.find(d => d.id === action.payload.documentId) || null
        : state.currentDocument;
      return { ...state, documents: updatedDocs, currentDocument: updatedCurrentDoc };
    }

    case 'UPDATE_PAGE': {
      const updatedDocs = state.documents.map(doc => {
        if (doc.id === action.payload.documentId) {
          return {
            ...doc,
            pages: doc.pages.map(page =>
              page.id === action.payload.page.id ? action.payload.page : page
            ),
            updatedAt: new Date(),
          };
        }
        return doc;
      });
      const updatedCurrentDoc = state.currentDocument?.id === action.payload.documentId
        ? updatedDocs.find(d => d.id === action.payload.documentId) || null
        : state.currentDocument;
      return { ...state, documents: updatedDocs, currentDocument: updatedCurrentDoc };
    }

    case 'DELETE_PAGE': {
      const updatedDocs = state.documents.map(doc => {
        if (doc.id === action.payload.documentId) {
          const newPages = doc.pages.filter(page => page.id !== action.payload.pageId);
          return {
            ...doc,
            pages: newPages,
            updatedAt: new Date(),
            thumbnail: newPages[0]?.imageData || undefined,
          };
        }
        return doc;
      });
      const updatedCurrentDoc = state.currentDocument?.id === action.payload.documentId
        ? updatedDocs.find(d => d.id === action.payload.documentId) || null
        : state.currentDocument;
      return { ...state, documents: updatedDocs, currentDocument: updatedCurrentDoc };
    }

    case 'SET_VIEW_MODE':
      return { ...state, viewMode: action.payload };

    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };

    case 'APPLY_FILTER': {
      const updatedDocs = state.documents.map(doc => {
        if (doc.id === action.payload.documentId) {
          return {
            ...doc,
            pages: doc.pages.map(page =>
              page.id === action.payload.pageId
                ? { ...page, filter: action.payload.filter }
                : page
            ),
            updatedAt: new Date(),
          };
        }
        return doc;
      });
      return { ...state, documents: updatedDocs };
    }

    default:
      return state;
  }
}

interface AppContextType {
  state: AppState;
  dispatch: Dispatch<AppAction>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  useEffect(() => {
    loadDocuments().then(docs => {
      dispatch({ type: 'SET_DOCUMENTS', payload: docs });
    });
  }, []);

  useEffect(() => {
    if (!state.isLoading) {
      saveDocuments(state.documents);
    }
  }, [state.documents, state.isLoading]);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
