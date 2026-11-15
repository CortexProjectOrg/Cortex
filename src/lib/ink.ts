import { getStroke } from 'perfect-freehand';

export interface InkPoint {
  x: number;
  y: number;
  pressure?: number;
}

export interface InkStroke {
  id: string;
  points: [number, number, number][]; // [x, y, pressure]
  color: string;
  size: number;
  isHighlighter?: boolean;
}

export interface TextAnnotation {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  fontSize: number;
}

export const PEN_COLORS = [
  { label: 'Black Ink', value: '#1e2822' },
  { label: 'Blueprint Blue', value: '#1a5f8a' },
  { label: 'Crimson Red', value: '#a32a2a' },
  { label: 'Forest Green', value: '#2e6b3f' }
];

export const HIGHLIGHTER_COLORS = [
  { label: 'Amber Yellow', value: '#e0b200' },
  { label: 'Sage Green', value: '#48a860' },
  { label: 'Cyan', value: '#0ea5e9' }
];

export const ERASER_THRESHOLD = 24;

export interface InkVisualizationMeta {
  geometry: 'academic-margin-v1';
  canonicalWidth: number;
  contentWidth: number;
  marginWidth: number;
  version: number;
}

export const CANONICAL_PAGE_GEOMETRY: InkVisualizationMeta = {
  geometry: 'academic-margin-v1',
  canonicalWidth: 960,
  contentWidth: 640,
  marginWidth: 240,
  version: 2
};

export interface InkData {
  version: 1 | 2;
  width: number;
  height: number;
  strokes: InkStroke[];
  textAnnotations?: TextAnnotation[];
  visualization?: InkVisualizationMeta;
}

export function getSvgPathFromStroke(stroke: number[][]): string {
  if (!stroke.length) return '';

  const d = stroke.reduce(
    (acc, [x0, y0], i, arr) => {
      const [x1, y1] = arr[(i + 1) % arr.length];
      acc.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2);
      return acc;
    },
    ['M', ...stroke[0], 'Q']
  );

  d.push('Z');
  return d.join(' ');
}

export function renderStrokeToPath(stroke: InkStroke): string {
  const options = {
    size: stroke.size,
    thinning: stroke.isHighlighter ? 0.1 : 0.5,
    smoothing: 0.5,
    streamline: 0.55,
    easing: (t: number) => t,
    start: {
      taper: 0,
      cap: true
    },
    end: {
      taper: 0,
      cap: true
    }
  };

  const points = stroke.points.map(p => [p[0], p[1], p[2] || 0.5]);
  const outline = getStroke(points, options);
  return getSvgPathFromStroke(outline);
}

export function serializeInk(
  strokes: InkStroke[],
  width = 960,
  height = 1600,
  visualization: InkVisualizationMeta = CANONICAL_PAGE_GEOMETRY,
  textAnnotations: TextAnnotation[] = []
): string {
  const data: InkData = {
    version: 2,
    width,
    height,
    strokes,
    textAnnotations,
    visualization
  };
  return JSON.stringify(data);
}

export function deserializeInkPayload(serialized?: string): {
  strokes: InkStroke[];
  textAnnotations: TextAnnotation[];
  visualization?: InkVisualizationMeta;
  width: number;
  height: number;
} {
  if (!serialized) {
    return { strokes: [], textAnnotations: [], width: 960, height: 1600 };
  }
  try {
    const parsed = JSON.parse(serialized);
    if (parsed && typeof parsed === 'object') {
      const strokes = Array.isArray(parsed.strokes) ? parsed.strokes : Array.isArray(parsed) ? parsed : [];
      const textAnnotations = Array.isArray(parsed.textAnnotations) ? parsed.textAnnotations : [];
      return {
        strokes,
        textAnnotations,
        visualization: parsed.visualization,
        width: parsed.width || 960,
        height: parsed.height || 1600
      };
    }
    return { strokes: [], textAnnotations: [], width: 960, height: 1600 };
  } catch {
    return { strokes: [], textAnnotations: [], width: 960, height: 1600 };
  }
}

export function deserializeInk(serialized?: string): InkStroke[] {
  return deserializeInkPayload(serialized).strokes;
}

export function deserializeTextAnnotations(serialized?: string): TextAnnotation[] {
  return deserializeInkPayload(serialized).textAnnotations;
}

export function parseInkData(serialized?: string): InkData | null {
  if (!serialized) return null;
  try {
    const parsed = JSON.parse(serialized);
    if (parsed && Array.isArray(parsed.strokes)) {
      return {
        version: parsed.version || 1,
        width: parsed.width || 960,
        height: parsed.height || 1600,
        strokes: parsed.strokes,
        textAnnotations: Array.isArray(parsed.textAnnotations) ? parsed.textAnnotations : [],
        visualization: parsed.visualization
      };
    }
    if (Array.isArray(parsed)) {
      return {
        version: 1,
        width: 800,
        height: 600,
        strokes: parsed,
        textAnnotations: []
      };
    }
    return null;
  } catch {
    return null;
  }
}

export function inkToSvgString(
  strokes: InkStroke[],
  width = 960,
  height = 1600,
  textAnnotations: TextAnnotation[] = []
): string {
  const paths = strokes
    .map(stroke => {
      const d = renderStrokeToPath(stroke);
      const opacity = stroke.isHighlighter ? 0.35 : 1;
      return `<path d="${d}" fill="${stroke.color}" opacity="${opacity}" />`;
    })
    .join('\n  ');

  const texts = textAnnotations
    .map(ann => {
      const escaped = ann.text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      return `<text x="${ann.x}" y="${ann.y}" fill="${ann.color}" font-size="${ann.fontSize}" font-family="Georgia, serif">${escaped}</text>`;
    })
    .join('\n  ');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  ${paths}
  ${texts}
</svg>`;
}
