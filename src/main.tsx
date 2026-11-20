import 'katex/dist/katex.min.css';
import { Analytics } from '@vercel/analytics/react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './lib/auth';
import { PdfViewerProvider } from './lib/pdfViewerContext';
import { WorkspaceProvider } from './lib/workspace';
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
    {import.meta.env.PROD && (
      <Analytics
        beforeSend={(event) => {
          const url = new URL(event.url);
          if (/^\/notes\//i.test(url.pathname)) url.pathname = '/notes';
          url.search = '';
          url.hash = '';
          return { ...event, url: url.href };
        }}
      />
    )}
  </BrowserRouter>
);
