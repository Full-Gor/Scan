import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Text,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useApp } from '../context/AppContext';
import { copyImageToDocuments, generateUUID } from '../utils/imageProcessing';
import type { Document, ScannedPage } from '../types';

export function CameraScreen() {
  const { state, dispatch } = useApp();
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [isCapturing, setIsCapturing] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, []);

  const takePicture = async () => {
    if (!cameraRef.current || isCapturing) return;

    setIsCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
      });

      if (photo?.uri) {
        const savedUri = await copyImageToDocuments(photo.uri);
        await handleCapturedImage(savedUri);
      }
    } catch (error) {
      console.error('Error taking picture:', error);
      Alert.alert('Erreur', 'Impossible de prendre la photo');
    } finally {
      setIsCapturing(false);
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const savedUri = await copyImageToDocuments(result.assets[0].uri);
        await handleCapturedImage(savedUri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Erreur', 'Impossible de charger l\'image');
    }
  };

  const handleCapturedImage = async (uri: string) => {
    const page: ScannedPage = {
      id: generateUUID(),
      uri,
      originalUri: uri,
      filter: 'original',
      createdAt: Date.now(),
      order: 0,
    };

    if (state.currentDocument) {
      dispatch({
        type: 'ADD_PAGE_TO_DOCUMENT',
        payload: { documentId: state.currentDocument.id, page },
      });
    } else {
      const now = Date.now();
      const newDoc: Document = {
        id: generateUUID(),
        name: `Scan ${new Date().toLocaleDateString('fr-FR')}`,
        pages: [page],
        createdAt: now,
        updatedAt: now,
        thumbnail: uri,
      };
      dispatch({ type: 'ADD_DOCUMENT', payload: newDoc });
      dispatch({ type: 'SET_CURRENT_DOCUMENT', payload: newDoc });
    }

    dispatch({ type: 'SET_CURRENT_PAGE', payload: page });
    dispatch({ type: 'SET_VIEW_MODE', payload: 'editor' });
  };

  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  const goBack = () => {
    dispatch({ type: 'SET_VIEW_MODE', payload: 'gallery' });
  };

  if (!permission) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>
          L'accès à la caméra est requis pour scanner des documents
        </Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Autoriser la caméra</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={facing}
      >
        <View style={styles.header}>
          <TouchableOpacity style={styles.iconButton} onPress={goBack}>
            <Text style={styles.iconText}>{'<'}</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Scanner</Text>
          <TouchableOpacity style={styles.iconButton} onPress={toggleCameraFacing}>
            <Text style={styles.iconText}>{'⟳'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.scanGuide}>
          <View style={[styles.corner, styles.topLeft]} />
          <View style={[styles.corner, styles.topRight]} />
          <View style={[styles.corner, styles.bottomLeft]} />
          <View style={[styles.corner, styles.bottomRight]} />
        </View>

        <View style={styles.controls}>
          <TouchableOpacity style={styles.galleryButton} onPress={pickImage}>
            <Text style={styles.galleryIcon}>🖼️</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.captureButton, isCapturing && styles.capturing]}
            onPress={takePicture}
            disabled={isCapturing}
          >
            <View style={styles.captureInner} />
          </TouchableOpacity>

          <View style={styles.pageCount}>
            <Text style={styles.pageCountText}>
              {state.currentDocument?.pages.length || 0}
            </Text>
          </View>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  camera: {
    flex: 1,
    width: '100%',
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  permissionText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  permissionButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: {
    color: '#fff',
    fontSize: 24,
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  scanGuide: {
    position: 'absolute',
    top: '15%',
    left: '8%',
    right: '8%',
    bottom: '25%',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: '#007AFF',
    borderWidth: 3,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 8,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 8,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 8,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 8,
  },
  controls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 30,
    paddingBottom: 50,
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  galleryButton: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  galleryIcon: {
    fontSize: 24,
  },
  captureButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: '#fff',
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  capturing: {
    opacity: 0.7,
  },
  captureInner: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
    backgroundColor: '#fff',
  },
  pageCount: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pageCountText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});
