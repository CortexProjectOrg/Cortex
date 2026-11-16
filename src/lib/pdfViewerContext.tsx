import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import type { ResolvedPaper } from './paperUtils';

interface PdfViewerContextValue {
  activePaper: ResolvedPaper | null;
  openPaper: (paper: ResolvedPaper) => void;
  closePaper: () => void;
  viewerMode: 'modal' | 'split';
  setViewerMode: (mode: 'modal' | 'split') => void;
}

const PdfViewerContext = createContext<PdfViewerContextValue | null>(null);

export function PdfViewerProvider({ children }: { children: ReactNode }) {
  const [activePaper, setActivePaper] = useState<ResolvedPaper | null>(null);
  const [viewerMode, setViewerMode] = useState<'modal' | 'split'>('modal');

  const openPaper = useCallback((paper: ResolvedPaper) => {
    setActivePaper(paper);
  }, []);

  const closePaper = useCallback(() => {
    setActivePaper(null);
  }, []);

  return (
    <PdfViewerContext.Provider
      value={{
        activePaper,
        openPaper,
        closePaper,
        viewerMode,
        setViewerMode
      }}
    >
      {children}
    </PdfViewerContext.Provider>
  );
}

export function usePdfViewer(): PdfViewerContextValue {
  const ctx = useContext(PdfViewerContext);
  if (!ctx) {
    // Safe no-op fallback when rendered outside provider in isolated unit tests
    return {
      activePaper: null,
      openPaper: () => {},
      closePaper: () => {},
      viewerMode: 'modal',
      setViewerMode: () => {}
    };
  }
  return ctx;
}
