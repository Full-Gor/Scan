import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useApp } from '../context/AppContext';
import { rotateImage } from '../utils/imageProcessing';
import type { FilterType } from '../types';

const FILTERS: { type: FilterType; label: string }[] = [
  { type: 'original', label: 'Original' },
  { type: 'magic', label: 'Magic' },
  { type: 'grayscale', label: 'Gris' },
  { type: 'blackwhite', label: 'N&B' },
];

export function EditorScreen() {
  const { state, dispatch } = useApp();
  const [currentFilter, setCurrentFilter] = useState<FilterType>('original');
  const [previewUri, setPreviewUri] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  const currentPage = state.currentPage;
  const currentDocument = state.currentDocument;

  useEffect(() => {
    if (currentPage) {
      setCurrentFilter(currentPage.filter);
      setPreviewUri(currentPage.uri);
    }
  }, [currentPage]);

  const handleFilterChange = async (filter: FilterType) => {
    if (!currentPage || !currentDocument || isProcessing) return;

    setIsProcessing(true);
    setCurrentFilter(filter);

    // For now, we just save the filter type - actual filtering would need native modules
    const updatedPage = {
      ...currentPage,
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

    try {
      const rotatedUri = await rotateImage(currentPage.originalUri, 90);
      setPreviewUri(rotatedUri);

      const updatedPage = {
        ...currentPage,
        uri: rotatedUri,
        originalUri: rotatedUri,
      };

      dispatch({
        type: 'UPDATE_PAGE',
        payload: { documentId: currentDocument.id, page: updatedPage },
      });

      dispatch({ type: 'SET_CURRENT_PAGE', payload: updatedPage });
    } catch (error) {
      console.error('Error rotating:', error);
    }

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
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.textButton} onPress={handleRetake}>
          <Text style={styles.textButtonLabel}>Reprendre</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Modifier</Text>
        <TouchableOpacity style={styles.textButton} onPress={handleDone}>
          <Text style={[styles.textButtonLabel, styles.primaryText]}>Terminer</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.preview}>
        {isProcessing && (
          <View style={styles.processingOverlay}>
            <ActivityIndicator size="large" color="#007AFF" />
          </View>
        )}
        <Image source={{ uri: previewUri }} style={styles.previewImage} resizeMode="contain" />
      </View>

      <View style={styles.tools}>
        <TouchableOpacity
          style={styles.toolButton}
          onPress={handleRotate}
          disabled={isProcessing}
        >
          <Text style={styles.toolIcon}>⟳</Text>
          <Text style={styles.toolLabel}>Rotation</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.filterSection}>
        <Text style={styles.filterTitle}>FILTRES</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterList}>
          {FILTERS.map((filter) => (
            <TouchableOpacity
              key={filter.type}
              style={[styles.filterButton, currentFilter === filter.type && styles.filterActive]}
              onPress={() => handleFilterChange(filter.type)}
              disabled={isProcessing}
            >
              <View style={[styles.filterPreview, currentFilter === filter.type && styles.filterPreviewActive]}>
                <Image
                  source={{ uri: previewUri }}
                  style={styles.filterPreviewImage}
                  resizeMode="cover"
                />
              </View>
              <Text style={[styles.filterLabel, currentFilter === filter.type && styles.filterLabelActive]}>
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionButton} onPress={handleAddMore}>
          <Text style={styles.actionIcon}>+</Text>
          <Text style={styles.actionLabel}>Ajouter page</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#2a2a2a',
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: '#fff',
  },
  textButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  textButtonLabel: {
    fontSize: 15,
    color: '#fff',
  },
  primaryText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  preview: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  previewImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  tools: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  toolButton: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 8,
  },
  toolIcon: {
    fontSize: 28,
    color: '#fff',
    marginBottom: 4,
  },
  toolLabel: {
    fontSize: 12,
    color: '#fff',
  },
  filterSection: {
    padding: 16,
  },
  filterTitle: {
    fontSize: 13,
    color: '#999',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  filterList: {
    flexDirection: 'row',
  },
  filterButton: {
    alignItems: 'center',
    marginRight: 12,
    opacity: 0.7,
  },
  filterActive: {
    opacity: 1,
  },
  filterPreview: {
    width: 60,
    height: 60,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  filterPreviewActive: {
    borderColor: '#007AFF',
  },
  filterPreviewImage: {
    width: '100%',
    height: '100%',
  },
  filterLabel: {
    fontSize: 12,
    color: '#fff',
    marginTop: 8,
  },
  filterLabelActive: {
    color: '#007AFF',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingBottom: 40,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  actionIcon: {
    fontSize: 20,
    color: '#fff',
    marginRight: 8,
  },
  actionLabel: {
    fontSize: 15,
    color: '#fff',
  },
});
