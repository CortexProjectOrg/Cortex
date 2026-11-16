import { describe, expect, it } from 'vitest';
import { getUserData, saveUserData } from '../api/lib/storage';
import { emptyWorkspace, mergeWorkspace, type Note, type Workspace } from '../src/lib/model';

describe('Cross-Device Synchronization & Conflict Resolution', () => {
  it('unions notes created across multiple devices without data loss', () => {
    const wsDeviceA: Workspace = {
      ...emptyWorkspace(),
      notes: [
        {
          id: 'note-a',
          title: 'Notes on Tablet',
          body: 'Derivation of transvections',
          inkData: '{"version":1,"strokes":[{"id":"s1","points":[[1,2,0.5]],"color":"#123456","size":3}]}',
          lectureInk: '{"version":1,"strokes":[{"id":"s2","points":[[1,2,0.5]],"color":"#123456","size":3}]}',
          createdAt: '2026-11-15T10:00:00.000Z',
          updatedAt: '2026-11-15T10:00:00.000Z'
        }
      ]
    };

    const wsDeviceB: Workspace = {
      ...emptyWorkspace(),
      notes: [
        {
          id: 'note-b',
          title: 'Notes on PC',
          body: 'Rust implementation of tableau row operations',
          createdAt: '2026-11-15T11:00:00.000Z',
          updatedAt: '2026-11-15T11:00:00.000Z'
        }
      ]
    };

    const merged = mergeWorkspace(wsDeviceA, wsDeviceB);
    expect(merged.notes.length).toBe(2);
    expect(merged.notes.some((n) => n.id === 'note-a')).toBe(true);
    expect(merged.notes.some((n) => n.id === 'note-b')).toBe(true);

    const noteA = merged.notes.find((n) => n.id === 'note-a')!;
    expect(noteA.inkData).toBeTruthy();
    expect(noteA.lectureInk).toBeTruthy();
  });

  it('resolves conflicting edits on the same note by keeping the latest updatedAt', () => {
    const olderNote: Note = {
      id: 'shared-note-1',
      title: 'Initial Title',
      body: 'Initial rough notes',
      createdAt: '2026-11-15T09:00:00.000Z',
      updatedAt: '2026-11-15T09:30:00.000Z'
    };

    const newerNote: Note = {
      id: 'shared-note-1',
      title: 'Polished Title with Proof',
      body: 'Rigorous proof using Mod-2 Gram Schmidt',
      lectureInk:
        '{"version":1,"strokes":[{"id":"stroke-highlight","points":[[1,2,0.5]],"color":"#123456","size":3}]}',
      createdAt: '2026-11-15T09:00:00.000Z',
      updatedAt: '2026-11-15T10:45:00.000Z'
    };

    const ws1: Workspace = { ...emptyWorkspace(), notes: [olderNote] };
    const ws2: Workspace = { ...emptyWorkspace(), notes: [newerNote] };

    // Case 1: Merge newer into older
    const merged1 = mergeWorkspace(ws1, ws2);
    expect(merged1.notes.length).toBe(1);
    expect(merged1.notes[0].title).toBe('Polished Title with Proof');
    expect(merged1.notes[0].lectureInk).toBe(
      '{"version":1,"strokes":[{"id":"stroke-highlight","points":[[1,2,0.5]],"color":"#123456","size":3}]}'
    );

    // Case 2: Merge older into newer (order independence)
    const merged2 = mergeWorkspace(ws2, ws1);
    expect(merged2.notes.length).toBe(1);
    expect(merged2.notes[0].title).toBe('Polished Title with Proof');
  });

  it('deduplicates completed lectures and progress tracking', () => {
    const wsA: Workspace = {
      ...emptyWorkspace(),
      completedLectures: ['L01-sets-maps-proofs', 'L02-groups-modular-arithmetic'],
      lectureProgress: {
        'L01-sets-maps-proofs': { status: 'completed', completedAt: '2026-11-15T10:00:00.000Z' }
      }
    };

    const wsB: Workspace = {
      ...emptyWorkspace(),
      completedLectures: ['L02-groups-modular-arithmetic', 'L03-finite-fields-gf2-gfp'],
      lectureProgress: {
        'L03-finite-fields-gf2-gfp': { status: 'completed', completedAt: '2026-11-15T12:00:00.000Z' }
      }
    };

    const merged = mergeWorkspace(wsA, wsB);
    expect(merged.completedLectures.length).toBe(3);
    expect(merged.completedLectures).toContain('L01-sets-maps-proofs');
    expect(merged.completedLectures).toContain('L02-groups-modular-arithmetic');
    expect(merged.completedLectures).toContain('L03-finite-fields-gf2-gfp');
    expect(merged.lectureProgress['L01-sets-maps-proofs'].status).toBe('completed');
    expect(merged.lectureProgress['L03-finite-fields-gf2-gfp'].status).toBe('completed');
  });

  it('does not report success without a durable backend', async () => {
    const previous = { ...process.env };
    for (const key of ['DATABASE_URL', 'POSTGRES_URL', 'NEON_DATABASE_URL', 'POSTGRES_PRISMA_URL'])
      delete process.env[key];
    try {
      await expect(saveUserData('test', emptyWorkspace(), 0)).rejects.toThrow('not configured');
      await expect(getUserData('test')).rejects.toThrow('not configured');
    } finally {
      process.env = previous;
    }
  });
});
