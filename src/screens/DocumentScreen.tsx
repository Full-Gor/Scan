import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
} from 'react-native';
import * as Sharing from 'expo-sharing';
import { useApp } from '../context/AppContext';
import type { ScannedPage } from '../types';

export function DocumentScreen() {
  const { state, dispatch } = useApp();
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
      Alert.alert(
        'Supprimer',
        'Ceci supprimera le document entier',
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Supprimer',
            style: 'destructive',
            onPress: () => {
              dispatch({ type: 'DELETE_DOCUMENT', payload: document.id });
              dispatch({ type: 'SET_VIEW_MODE', payload: 'gallery' });
            },
          },
        ]
      );
    } else {
      Alert.alert(
        'Supprimer',
        'Supprimer cette page ?',
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Supprimer',
            style: 'destructive',
            onPress: () => {
              dispatch({
                type: 'DELETE_PAGE',
                payload: { documentId: document.id, pageId },
              });
            },
          },
        ]
      );
    }
  };

  const handleRename = () => {
    // Note: Alert.prompt is iOS only. For a full solution, use a modal with TextInput
    const newName = `${document.name} (copie)`;
    dispatch({
      type: 'UPDATE_DOCUMENT',
      payload: { ...document, name: newName },
    });
  };

  const handleShare = async () => {
    if (document.pages.length > 0 && await Sharing.isAvailableAsync()) {
      try {
        await Sharing.shareAsync(document.pages[0].uri);
      } catch (error) {
        Alert.alert('Erreur', 'Impossible de partager');
      }
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Supprimer',
      `Supprimer "${document.name}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => {
            dispatch({ type: 'DELETE_DOCUMENT', payload: document.id });
            dispatch({ type: 'SET_VIEW_MODE', payload: 'gallery' });
          },
        },
      ]
    );
  };

  const showMenu = () => {
    Alert.alert(
      document.name,
      '',
      [
        { text: 'Renommer', onPress: handleRename },
        { text: 'Partager', onPress: handleShare },
        { text: 'Supprimer', style: 'destructive', onPress: handleDelete },
        { text: 'Annuler', style: 'cancel' },
      ]
    );
  };

  const renderPage = ({ item, index }: { item: ScannedPage; index: number }) => (
    <View style={styles.pageItem}>
      <View style={styles.pageNumber}>
        <Text style={styles.pageNumberText}>{index + 1}</Text>
      </View>
      <TouchableOpacity style={styles.pageThumbnail} onPress={() => editPage(item)}>
        <Image source={{ uri: item.uri }} style={styles.pageImage} />
      </TouchableOpacity>
      <View style={styles.pageActions}>
        <TouchableOpacity style={styles.pageActionButton} onPress={() => editPage(item)}>
          <Text style={styles.pageActionIcon}>✏️</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.pageActionButton, styles.deleteButton]}
          onPress={() => deletePage(item.id)}
        >
          <Text style={styles.pageActionIcon}>🗑️</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconButton} onPress={goBack}>
          <Text style={styles.iconText}>{'<'}</Text>
        </TouchableOpacity>
        <View style={styles.titleArea}>
          <Text style={styles.title} numberOfLines={1}>{document.name}</Text>
          <Text style={styles.subtitle}>{document.pages.length} page(s)</Text>
        </View>
        <TouchableOpacity style={styles.iconButton} onPress={showMenu}>
          <Text style={styles.iconText}>⋮</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={document.pages}
        renderItem={renderPage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
      />

      <View style={styles.footer}>
        <TouchableOpacity style={styles.addButton} onPress={openCamera}>
          <Text style={styles.addButtonIcon}>+</Text>
          <Text style={styles.addButtonText}>Ajouter une page</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.exportButton} onPress={handleShare}>
          <Text style={styles.exportButtonIcon}>📤</Text>
          <Text style={styles.exportButtonText}>Partager</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  iconButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: {
    fontSize: 24,
    color: '#666',
  },
  titleArea: {
    flex: 1,
    marginHorizontal: 8,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  subtitle: {
    fontSize: 13,
    color: '#999',
  },
  list: {
    padding: 16,
    paddingBottom: 120,
  },
  pageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  pageNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  pageNumberText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  pageThumbnail: {
    width: 80,
    height: 100,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  pageImage: {
    width: '100%',
    height: '100%',
  },
  pageActions: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  pageActionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    // Additional styling if needed
  },
  pageActionIcon: {
    fontSize: 16,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: 16,
    paddingBottom: 40,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    gap: 12,
  },
  addButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f0f0',
    paddingVertical: 14,
    borderRadius: 12,
  },
  addButtonIcon: {
    fontSize: 20,
    marginRight: 8,
    color: '#333',
  },
  addButtonText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
  },
  exportButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    borderRadius: 12,
  },
  exportButtonIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  exportButtonText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#fff',
  },
});
