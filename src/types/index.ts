export interface ScannedPage {
  id: string;
  uri: string;
  originalUri: string;
  filter: FilterType;
  createdAt: number;
  order: number;
}

export interface Document {
  id: string;
  name: string;
  pages: ScannedPage[];
  createdAt: number;
  updatedAt: number;
  thumbnail?: string;
}

export type FilterType = 'original' | 'grayscale' | 'blackwhite' | 'magic';

export type ViewMode = 'camera' | 'gallery' | 'editor' | 'document';
