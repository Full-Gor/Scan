import * as ImageManipulator from 'expo-image-manipulator';
import type { FilterType } from '../types';

export async function applyFilter(uri: string, filter: FilterType): Promise<string> {
  if (filter === 'original') {
    return uri;
  }

  try {
    const actions: ImageManipulator.Action[] = [];

    // For grayscale effect, we use a workaround since expo-image-manipulator doesn't have direct grayscale
    // We'll save with compression which slightly desaturates, but for real grayscale we'd need react-native-image-filter-kit

    const result = await ImageManipulator.manipulateAsync(
      uri,
      actions,
      { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
    );

    return result.uri;
  } catch (error) {
    console.error('Error applying filter:', error);
    return uri;
  }
}

export async function rotateImage(uri: string, degrees: number): Promise<string> {
  try {
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [{ rotate: degrees }],
      { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG }
    );
    return result.uri;
  } catch (error) {
    console.error('Error rotating image:', error);
    return uri;
  }
}

export async function resizeImage(uri: string, maxWidth: number): Promise<string> {
  try {
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: maxWidth } }],
      { compress: 0.85, format: ImageManipulator.SaveFormat.JPEG }
    );
    return result.uri;
  } catch (error) {
    console.error('Error resizing image:', error);
    return uri;
  }
}

export async function copyImageToDocuments(uri: string): Promise<string> {
  // Camera photos are already stored, just return the URI
  // For a production app, you might want to copy to a permanent location
  return uri;
}

export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
