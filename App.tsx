import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider, useApp } from './src/context/AppContext';
import { CameraScreen } from './src/screens/CameraScreen';
import { GalleryScreen } from './src/screens/GalleryScreen';
import { EditorScreen } from './src/screens/EditorScreen';
import { DocumentScreen } from './src/screens/DocumentScreen';

function AppContent() {
  const { state } = useApp();

  switch (state.viewMode) {
    case 'camera':
      return <CameraScreen />;
    case 'editor':
      return <EditorScreen />;
    case 'document':
      return <DocumentScreen />;
    case 'gallery':
    default:
      return <GalleryScreen />;
  }
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <StatusBar style="auto" />
        <AppContent />
      </AppProvider>
    </SafeAreaProvider>
  );
}
