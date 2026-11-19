import { describe, expect, it } from 'vitest';
import {
  docRoute,
  emptyWorkspace,
  exportWorkspaceJson,
  lectureRoute,
  makeNote,
  noteMarkdown,
  slug,
  validateWorkspace,
  type Note
} from '../src/lib/model';

describe('Model & Workspace Integrity', () => {
  it('creates well-formed notes with auto-generated timestamps and IDs', () => {
    const note = makeNote('Test Symplectic Note', undefined, 'lec-01', 'A test note body');
    expect(note.id).toBeTruthy();
    expect(note.title).toBe('Test Symplectic Note');
    expect(note.body).toBe('A test note body');
    expect(note.lectureId).toBe('lec-01');
    expect(note.createdAt).toBeTruthy();
    expect(note.updatedAt).toBeTruthy();
    expect(new Date(note.createdAt).getTime()).not.toBeNaN();
  });

  it('generates consistent URL slugs and routes', () => {
    expect(slug('Symplectic Inner Product & Mod-2 Gram Schmidt!')).toBe(
      'symplectic-inner-product-mod-2-gram-schmidt'
    );
    expect(docRoute('sessions/01-foundations/theory.md', 'gram-schmidt')).toBe(
      '/read/sessions/01-foundations/theory.md#gram-schmidt'
    );
    expect(lectureRoute('cliffords-stabilizers', 'cliffords-1')).toBe(
      '/topics/cliffords-stabilizers/cliffords-1'
    );
  });

  it('validates and sanitizes corrupt or incomplete workspace inputs', () => {
    expect(() => validateWorkspace(null)).toThrow('This file is not a valid Cortex backup.');
    expect(() => validateWorkspace({ version: 99, notes: [] })).toThrow(
      'This file is not a valid Cortex backup.'
    );

    const fallback = emptyWorkspace();
    expect(fallback.notes).toEqual([]);
    expect(fallback.studyPlan.activePathId).toBe('canonical-foundations-to-mastery');
    expect(fallback.completedLectures).toEqual([]);
    expect(fallback.lectureProgress).toEqual({});
  });

  it('preserves inkData and lectureInk fields during workspace validation', () => {
    const rawData = {
      version: 2,
      notes: [
        {
          id: 'note-1',
          title: 'Direct Lecture Annotations',
          body: 'Tested derivation of tableau',
          inkData: '{"version":1,"strokes":[{"id":"s1","points":[[1,2,0.5]],"color":"#123456","size":3}]}',
          lectureInk: '{"version":1,"strokes":[{"id":"s2","points":[[1,2,0.5]],"color":"#123456","size":3}]}',
          lectureId: 'stabilizer-tableau-canonical',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ],
      completedLectures: ['stabilizer-tableau-canonical'],
      lectureProgress: {
        'stabilizer-tableau-canonical': {
          status: 'completed',
          completedAt: new Date().toISOString()
        }
      },
      lastRead: {
        id: 'stabilizer-tableau-canonical',
        at: new Date().toISOString()
      },
      customPlans: [
        {
          id: 'custom-1',
          title: 'Weekend Deep Dive',
          targetAudience: 'Self',
          estimatedHours: 4,
          sessions: ['lec-1', 'lec-2']
        }
      ]
    };

    const validated = validateWorkspace(rawData);
    expect(validated.notes.length).toBe(1);
    expect(validated.notes[0].inkData).toBe(
      '{"version":1,"strokes":[{"id":"s1","points":[[1,2,0.5]],"color":"#123456","size":3}]}'
    );
    expect(validated.notes[0].lectureInk).toBe(
      '{"version":1,"strokes":[{"id":"s2","points":[[1,2,0.5]],"color":"#123456","size":3}]}'
    );
    expect(validated.notes[0].lectureId).toBe('stabilizer-tableau-canonical');
    expect(validated.completedLectures).toEqual(['stabilizer-tableau-canonical']);
    expect(validated.lectureProgress['stabilizer-tableau-canonical'].status).toBe('completed');
  });

  it('formats notes into clean markdown export', () => {
    const note: Note = {
      id: 'export-test',
      title: 'Phase Derivation',
      body: 'Calculated phase accumulation $(-1)^{\\beta}$',
      createdAt: '2026-11-15T12:00:00.000Z',
      updatedAt: '2026-11-15T12:30:00.000Z'
    };

    const md = noteMarkdown(note);
    expect(md).toContain('# Phase Derivation');
    expect(md).toContain('Calculated phase accumulation $(-1)^{\\beta}$');
    expect(md).toContain('Updated: 2026-11-15T12:30:00.000Z');
  });

  it('serializes workspace to JSON with 2-space indentation', () => {
    const ws = emptyWorkspace();
    const json = exportWorkspaceJson(ws);
    expect(typeof json).toBe('string');
    expect(json).toContain('"notes": []');
    expect(JSON.parse(json)).toEqual(ws);
  });
});
