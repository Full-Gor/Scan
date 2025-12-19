export interface ScannedPage {
  id: string;
  imageData: string;
  originalImage: string;
  filter: FilterType;
  createdAt: Date;
  order: number;
}

export interface Document {
  id: string;
  name: string;
  pages: ScannedPage[];
  createdAt: Date;
  updatedAt: Date;
  thumbnail?: string;
}

export type FilterType = 'original' | 'grayscale' | 'blackwhite' | 'magic' | 'color';

export type ViewMode = 'camera' | 'gallery' | 'editor' | 'document';

export interface CropArea {
  topLeft: Point;
  topRight: Point;
  bottomLeft: Point;
  bottomRight: Point;
}

export interface Point {
  x: number;
  y: number;
}
