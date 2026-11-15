import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './lib/auth';
import { WorkspaceProvider } from './lib/workspace';
import { PdfViewerProvider } from './lib/pdfViewerContext';
import App from './App';
import 'katex/dist/katex.min.css';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <AuthProvider>
      <WorkspaceProvider>
        <PdfViewerProvider>
          <App />
        </PdfViewerProvider>
      </WorkspaceProvider>
    </AuthProvider>
  </BrowserRouter>
);