import { describe, it, expect } from 'vitest';
import {
  serializeInk,
  deserializeInk,
  renderStrokeToPath,
  inkToSvgString,
  type InkStroke
} from '../src/lib/ink';

describe('Ink vector smoothing and serialization engine', () => {
  const sampleStroke: InkStroke = {
    id: 'stroke-1',
    points: [
      [10, 20, 0.5],
      [15, 25, 0.7],
      [30, 40, 0.6]
    ],
    color: '#1a5f8a',
    size: 3.5,
    isHighlighter: false
  };

  const highlighterStroke: InkStroke = {
    id: 'stroke-2',
    points: [
      [50, 100, 0.5],
      [100, 100, 0.5],
      [150, 100, 0.5]
    ],
    color: '#e0b200',
    size: 18,
    isHighlighter: true
  };

  it('serializes and deserializes ink strokes without data loss', () => {
    const serialized = serializeInk([sampleStroke, highlighterStroke], 850, 1200);
    expect(typeof serialized).toBe('string');

    const parsed = JSON.parse(serialized);
    expect(parsed.version).toBe(1);
    expect(parsed.width).toBe(850);
    expect(parsed.height).toBe(1200);
    expect(parsed.strokes.length).toBe(2);

    const deserialized = deserializeInk(serialized);
    expect(deserialized.length).toBe(2);
    expect(deserialized[0]).toEqual(sampleStroke);
    expect(deserialized[1]).toEqual(highlighterStroke);
  });

  it('gracefully handles empty or corrupted input', () => {
    expect(deserializeInk(undefined)).toEqual([]);
    expect(deserializeInk('')).toEqual([]);
    expect(deserializeInk('{ corrupted json')).toEqual([]);
    expect(deserializeInk('{}')).toEqual([]);
    expect(deserializeInk('{"version":1,"strokes":[]}')).toEqual([]);
  });

  it('renders smooth SVG path commands with perfect-freehand', () => {
    const path = renderStrokeToPath(sampleStroke);
    expect(path).toBeTruthy();
    expect(path.startsWith('M')).toBe(true);
    expect(path.includes('Q')).toBe(true);
    expect(path.endsWith('Z')).toBe(true);
  });

  it('generates well-formed SVG string with correct opacity for highlighters and pens', () => {
    const svg = inkToSvgString([sampleStroke, highlighterStroke], 800, 600);
    expect(svg).toContain('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600"');
    expect(svg).toContain('fill="#1a5f8a" opacity="1"');
    expect(svg).toContain('fill="#e0b200" opacity="0.35"');
    expect(svg).toContain('</svg>');
  });
});
