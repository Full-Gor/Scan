import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as Sharing from 'expo-sharing';
import { useApp } from '../context/AppContext';
import type { Document } from '../types';

export function GalleryScreen() {
  const { state, dispatch } = useApp();
  const [selectedDocs, setSelectedDocs] = useState<Set<string>>(new Set());
  const [isSelecting, setIsSelecting] = useState(false);

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
    Alert.alert(
      'Supprimer',
      `Supprimer ${selectedDocs.size} document(s) ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => {
            selectedDocs.forEach(docId => {
              dispatch({ type: 'DELETE_DOCUMENT', payload: docId });
            });
            setSelectedDocs(new Set());
            setIsSelecting(false);
          },
        },
      ]
    );
  };

  const cancelSelection = () => {
    setSelectedDocs(new Set());
    setIsSelecting(false);
  };

  const renameDocument = (doc: Document) => {
    // Note: Alert.prompt is iOS only. For a full solution, use a modal with TextInput
    const newName = `${doc.name} (copie)`;
    dispatch({
      type: 'UPDATE_DOCUMENT',
      payload: { ...doc, name: newName },
    });
  };

  const shareDocument = async (doc: Document) => {
    if (doc.pages.length > 0 && await Sharing.isAvailableAsync()) {
      try {
        await Sharing.shareAsync(doc.pages[0].uri);
      } catch (error) {
        Alert.alert('Erreur', 'Impossible de partager');
      }
    }
  };

  const deleteDocument = (doc: Document) => {
    Alert.alert(
      'Supprimer',
      `Supprimer "${doc.name}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => {
            dispatch({ type: 'DELETE_DOCUMENT', payload: doc.id });
          },
        },
      ]
    );
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const renderDocument = ({ item }: { item: Document }) => (
    <TouchableOpacity
      style={[styles.documentCard, selectedDocs.has(item.id) && styles.selected]}
      onPress={() => openDocument(item)}
      onLongPress={() => handleLongPress(item.id)}
    >
      {isSelecting && (
        <View style={[styles.checkbox, selectedDocs.has(item.id) && styles.checkboxSelected]}>
          {selectedDocs.has(item.id) && <Text style={styles.checkmark}>✓</Text>}
        </View>
      )}
      <View style={styles.thumbnail}>
        {item.thumbnail ? (
          <Image source={{ uri: item.thumbnail }} style={styles.thumbnailImage} />
        ) : (
          <View style={styles.noThumbnail}>
            <Text style={styles.noThumbnailText}>📄</Text>
          </View>
        )}
        <View style={styles.pageCountBadge}>
          <Text style={styles.pageCountText}>{item.pages.length}</Text>
        </View>
      </View>
      <View style={styles.documentInfo}>
        <Text style={styles.documentName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.documentDate}>{formatDate(item.updatedAt)}</Text>
      </View>
      {!isSelecting && (
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => {
            Alert.alert(
              item.name,
              '',
              [
                { text: 'Renommer', onPress: () => renameDocument(item) },
                { text: 'Partager', onPress: () => shareDocument(item) },
                { text: 'Supprimer', style: 'destructive', onPress: () => deleteDocument(item) },
                { text: 'Annuler', style: 'cancel' },
              ]
            );
          }}
        >
          <Text style={styles.menuIcon}>⋮</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );

  if (state.isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {isSelecting ? (
          <>
            <TouchableOpacity style={styles.headerButton} onPress={cancelSelection}>
              <Text style={styles.headerButtonText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{selectedDocs.size} sélectionné(s)</Text>
            <TouchableOpacity style={styles.headerButton} onPress={deleteSelected}>
              <Text style={[styles.headerButtonText, styles.deleteText]}>🗑️</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.headerTitle}>Mes Documents</Text>
            <View style={{ width: 44 }} />
          </>
        )}
      </View>

      {state.documents.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📄</Text>
          <Text style={styles.emptyTitle}>Aucun document</Text>
          <Text style={styles.emptySubtitle}>Scannez votre premier document</Text>
        </View>
      ) : (
        <FlatList
          data={state.documents}
          renderItem={renderDocument}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.list}
          columnWrapperStyle={styles.row}
        />
      )}

      <TouchableOpacity style={styles.fab} onPress={openCamera}>
        <Text style={styles.fabIcon}>📷</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  headerButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerButtonText: {
    fontSize: 20,
  },
  deleteText: {
    color: '#ff3b30',
  },
  list: {
    padding: 12,
    paddingBottom: 100,
  },
  row: {
    justifyContent: 'space-between',
  },
  documentCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  selected: {
    borderWidth: 3,
    borderColor: '#007AFF',
  },
  checkbox: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#007AFF',
    zIndex: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#007AFF',
  },
  checkmark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  thumbnail: {
    aspectRatio: 3 / 4,
    backgroundColor: '#f0f0f0',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  noThumbnail: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noThumbnailText: {
    fontSize: 48,
  },
  pageCountBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pageCountText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  documentInfo: {
    padding: 12,
  },
  documentName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  documentDate: {
    fontSize: 12,
    color: '#999',
  },
  menuButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuIcon: {
    fontSize: 18,
    color: '#666',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 80,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#999',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  fabIcon: {
    fontSize: 26,
  },
});
