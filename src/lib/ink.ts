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
  visualization: InkVisualizationMeta = CANONICAL_PAGE_GEOMETRY
): string {
  const data: InkData = {
    version: 2,
    width,
    height,
    strokes,
    visualization
  };
  return JSON.stringify(data);
}

export function deserializeInk(serialized?: string): InkStroke[] {
  if (!serialized) return [];
  try {
    const parsed = JSON.parse(serialized);
    if (parsed && Array.isArray(parsed.strokes)) {
      return parsed.strokes;
    }
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return [];
  } catch {
    return [];
  }
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
        visualization: parsed.visualization
      };
    }
    if (Array.isArray(parsed)) {
      return {
        version: 1,
        width: 800,
        height: 600,
        strokes: parsed
      };
    }
    return null;
  } catch {
    return null;
  }
}

export function inkToSvgString(strokes: InkStroke[], width = 960, height = 1600): string {
  const paths = strokes
    .map(stroke => {
      const d = renderStrokeToPath(stroke);
      const opacity = stroke.isHighlighter ? 0.35 : 1;
      return `<path d="${d}" fill="${stroke.color}" opacity="${opacity}" />`;
    })
    .join('\n  ');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  ${paths}
</svg>`;
}
