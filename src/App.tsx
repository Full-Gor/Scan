import { AppProvider, useApp } from './store/AppContext';
import { Camera } from './components/Camera';
import { Gallery } from './components/Gallery';
import { Editor } from './components/Editor';
import { DocumentView } from './components/DocumentView';
import './App.css';

function AppContent() {
  const { state } = useApp();

  switch (state.viewMode) {
    case 'camera':
      return <Camera />;
    case 'editor':
      return <Editor />;
    case 'document':
      return <DocumentView />;
    case 'gallery':
    default:
      return <Gallery />;
  }
}

function App() {
  return (
    <AppProvider>
      <div className="app">
        <AppContent />
      </div>
    </AppProvider>
  );
}

export default App;
