import { z } from 'zod';

const coordinate = z.number().finite().min(-100_000).max(100_000);
const id = z.string().min(1).max(160);
const color = z.string().regex(/^#[0-9a-f]{3}(?:[0-9a-f]{3})?(?:[0-9a-f]{2})?$/i);
export const strokeSchema = z.object({
  id,
  points: z
    .array(z.tuple([coordinate, coordinate, z.number().min(0).max(1)]))
    .min(1)
    .max(50_000),
  color,
  size: z.number().positive().max(100),
  isHighlighter: z.boolean().optional()
});
export const annotationSchema = z.object({
  id,
  x: coordinate,
  y: coordinate,
  text: z.string().max(20_000),
  color,
  fontSize: z.number().positive().max(200)
});
export const inkSchema = z.object({
  version: z.union([z.literal(1), z.literal(2)]).default(1),
  width: z.number().positive().max(10_000).default(960),
  height: z.number().positive().max(100_000).default(1600),
  strokes: z.array(strokeSchema).max(10_000),
  textAnnotations: z.array(annotationSchema).max(2000).default([]),
  visualization: z
    .object({
      geometry: z.literal('academic-margin-v1'),
      canonicalWidth: z.number().positive().max(10_000),
      contentWidth: z.number().positive().max(10_000),
      marginWidth: z.number().positive().max(10_000),
      version: z.number().int().min(1).max(3)
    })
    .optional()
});

export function parseInk(serialized: string) {
  if (serialized.length > 2_000_000) throw new Error('This drawing is too large.');
  const value: unknown = JSON.parse(serialized);
  return inkSchema.parse(
    Array.isArray(value) ? { version: 1, width: 800, height: 600, strokes: value } : value
  );
}
