import { describe, expect, it } from 'vitest';
import {
  CANONICAL_PAGE_GEOMETRY,
  deserializeInk,
  deserializeInkPayload,
  deserializeTextAnnotations,
  inkToSvgString,
  parseInkData,
  renderStrokeToPath,
  serializeInk,
  type InkStroke,
  type TextAnnotation
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

  const marginNoteStroke: InkStroke = {
    id: 'margin-note-1',
    points: [
      [720, 450, 0.5],
      [750, 460, 0.6],
      [790, 455, 0.5]
    ],
    color: '#a32a2a',
    size: 2.5,
    isHighlighter: false
  };

  const sampleTextAnnotation: TextAnnotation = {
    id: 'text-1',
    x: 710,
    y: 420,
    text: 'Note: domega = 0 implies closed symplectic form',
    color: '#1a5f8a',
    fontSize: 14
  };

  it('serializes ink strokes with Version 2 metadata and canonical page geometry', () => {
    const serialized = serializeInk([sampleStroke, highlighterStroke, marginNoteStroke], 960, 2400);
    expect(typeof serialized).toBe('string');

    const parsed = JSON.parse(serialized);
    expect(parsed.version).toBe(2);
    expect(parsed.width).toBe(960);
    expect(parsed.height).toBe(2400);
    expect(parsed.strokes.length).toBe(3);
    expect(parsed.visualization).toEqual(CANONICAL_PAGE_GEOMETRY);
    expect(parsed.visualization.canonicalWidth).toBe(960);
    expect(parsed.visualization.contentWidth).toBe(640);
    expect(parsed.visualization.marginWidth).toBe(240);

    const deserialized = deserializeInk(serialized);
    expect(deserialized.length).toBe(3);
    expect(deserialized[0]).toEqual(sampleStroke);
    expect(deserialized[1]).toEqual(highlighterStroke);
    expect(deserialized[2]).toEqual(marginNoteStroke);
  });

  it('serializes and deserializes typed text annotations alongside ink strokes', () => {
    const serialized = serializeInk([sampleStroke], 960, 2000, CANONICAL_PAGE_GEOMETRY, [
      sampleTextAnnotation
    ]);

    const payload = deserializeInkPayload(serialized);
    expect(payload.strokes.length).toBe(1);
    expect(payload.textAnnotations.length).toBe(1);
    expect(payload.textAnnotations[0]).toEqual(sampleTextAnnotation);

    const justTexts = deserializeTextAnnotations(serialized);
    expect(justTexts.length).toBe(1);
    expect(justTexts[0].text).toContain('domega = 0');
  });

  it('maintains full backward compatibility with legacy Version 1 payloads', () => {
    const legacyV1Payload = JSON.stringify({
      version: 1,
      width: 850,
      height: 1200,
      strokes: [sampleStroke, highlighterStroke]
    });

    const deserialized = deserializeInk(legacyV1Payload);
    expect(deserialized.length).toBe(2);
    expect(deserialized[0]).toEqual(sampleStroke);
    expect(deserialized[1]).toEqual(highlighterStroke);

    const parsedData = parseInkData(legacyV1Payload);
    expect(parsedData).not.toBeNull();
    expect(parsedData?.version).toBe(1);
    expect(parsedData?.width).toBe(850);
    expect(parsedData?.strokes.length).toBe(2);
    expect(parsedData?.textAnnotations).toEqual([]);
  });

  it('parses version 2 ink data with complete visualization metadata', () => {
    const serialized = serializeInk([marginNoteStroke], 960, 1600, CANONICAL_PAGE_GEOMETRY, [
      sampleTextAnnotation
    ]);
    const parsedData = parseInkData(serialized);

    expect(parsedData).not.toBeNull();
    expect(parsedData?.version).toBe(2);
    expect(parsedData?.visualization?.geometry).toBe('academic-margin-v1');
    expect(parsedData?.visualization?.marginWidth).toBe(240);
    expect(parsedData?.textAnnotations?.length).toBe(1);
  });

  it('gracefully handles empty or corrupted input', () => {
    expect(deserializeInk(undefined)).toEqual([]);
    expect(deserializeInk('')).toEqual([]);
    expect(deserializeInk('{ corrupted json')).toEqual([]);
    expect(deserializeInk('{}')).toEqual([]);
    expect(deserializeInk('{"version":1,"strokes":[]}')).toEqual([]);
    expect(deserializeInk('{"version":2,"strokes":[]}')).toEqual([]);
    expect(deserializeTextAnnotations(undefined)).toEqual([]);
    expect(deserializeTextAnnotations('{ bad json')).toEqual([]);
    expect(parseInkData(undefined)).toBeNull();
    expect(parseInkData('{ bad json')).toBeNull();
  });

  it('renders smooth SVG path commands with perfect-freehand', () => {
    const path = renderStrokeToPath(sampleStroke);
    expect(path).toBeTruthy();
    expect(path.startsWith('M')).toBe(true);
    expect(path.includes('Q')).toBe(true);
    expect(path.endsWith('Z')).toBe(true);
  });

  it('generates well-formed SVG string with correct opacity for highlighters, pens and text', () => {
    const svg = inkToSvgString([sampleStroke, highlighterStroke], 960, 1600, [sampleTextAnnotation]);
    expect(svg).toContain('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 1600"');
    expect(svg).toContain('fill="#1a5f8a" opacity="1"');
    expect(svg).toContain('fill="#e0b200" opacity="0.35"');
    expect(svg).toContain('<text x="710" y="420"');
    expect(svg).toContain('domega = 0 implies closed symplectic form');
    expect(svg).toContain('</svg>');
  });
});
