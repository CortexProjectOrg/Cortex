import { describe, expect, it } from 'vitest';
import { documents } from '../src/lib/content';
import { ALL_LECTURES, LECTURE_MAP, MASTERY_PACKS, TOPICS } from '../src/lib/curriculum';

describe('Curriculum structure and rendering inputs', () => {
  it('validates all 68 lectures have required theory and worked-example fields', () => {
    expect(ALL_LECTURES.length).toBe(68);

    ALL_LECTURES.forEach((lec) => {
      // Basic lecture identification and metadata
      expect(lec.id, `Lecture missing id`).toBeTruthy();
      expect(lec.title, `Lecture ${lec.id} missing title`).toBeTruthy();
      expect(typeof lec.subtitle).toBe('string');
      expect(lec.question, `Lecture ${lec.id} missing question`).toBeTruthy();
      expect(lec.packNumber, `Lecture ${lec.id} invalid packNumber`).toBeGreaterThanOrEqual(1);
      expect(lec.packNumber, `Lecture ${lec.id} invalid packNumber`).toBeLessThanOrEqual(
        MASTERY_PACKS.length
      );
      expect(lec.packSlot, `Lecture ${lec.id} invalid packSlot`).toBeGreaterThanOrEqual(1);
      expect(lec.packSlot, `Lecture ${lec.id} invalid packSlot`).toBeLessThanOrEqual(4);

      // Verify content depth and completeness
      expect(lec.content.motivation.trim().length, `Lecture ${lec.id} motivation too short`).toBeGreaterThan(
        30
      );
      expect(lec.content.theory.trim().length, `Lecture ${lec.id} theory too short`).toBeGreaterThan(50);
      expect(
        lec.content.workedExample.trim().length,
        `Lecture ${lec.id} workedExample too short`
      ).toBeGreaterThan(50);
      expect(lec.content.exercise.trim().length, `Lecture ${lec.id} exercise too short`).toBeGreaterThan(30);

      // Verify mathematical citations
      expect(
        lec.theoreticalCitations.length,
        `Lecture ${lec.id} missing theoretical citations`
      ).toBeGreaterThanOrEqual(1);
      lec.theoreticalCitations.forEach((cite) => {
        expect(cite.formulaName.trim().length).toBeGreaterThan(0);
        expect(cite.expression.trim().length).toBeGreaterThan(0);
        expect(cite.source.trim().length).toBeGreaterThan(0);
        expect(cite.theoremOrEquation.trim().length).toBeGreaterThan(0);

        // Verify balanced braces in KaTeX expressions
        const openBraces = (cite.expression.match(/\{/g) || []).length;
        const closeBraces = (cite.expression.match(/\}/g) || []).length;
        expect(openBraces, `Unbalanced braces in formula ${cite.formulaName}: ${cite.expression}`).toBe(
          closeBraces
        );
      });

      // Verify paper references
      expect(lec.paperReferences.length, `Lecture ${lec.id} missing paper references`).toBeGreaterThanOrEqual(
        1
      );
      lec.paperReferences.forEach((paper) => {
        expect(paper.title.trim().length).toBeGreaterThan(0);
        expect(paper.authors.trim().length).toBeGreaterThan(0);
        expect(paper.citation.trim().length).toBeGreaterThan(0);
        expect(paper.relevantSections.trim().length).toBeGreaterThan(0);
        if (paper.arxivUrl) {
          expect(paper.arxivUrl).toMatch(/^https:\/\//);
        }
      });
    });
  });

  it('validates all topics cover their assigned lectures without gaps', () => {
    expect(TOPICS.length).toBe(16);
    const assignedIds = new Set<string>();

    TOPICS.forEach((topic, idx) => {
      expect(topic.number).toBe(idx + 1);
      expect(topic.title.trim().length).toBeGreaterThan(0);
      expect(topic.lectureIds.length).toBeGreaterThanOrEqual(1);

      topic.lectureIds.forEach((id) => {
        expect(assignedIds.has(id), `Duplicate lecture assignment: ${id}`).toBe(false);
        assignedIds.add(id);
        const found = LECTURE_MAP.get(id);
        expect(found, `Topic ${topic.id} references non-existent lecture ${id}`).toBeDefined();
        expect(found!.topicId).toBe(topic.id);
      });
    });

    expect(assignedIds.size).toBe(68);
  });

  it('validates 17 mastery packs partition the syllabus into 4 consecutive slots', () => {
    expect(MASTERY_PACKS.length).toBe(17);
    const seenLectures = new Set<string>();

    MASTERY_PACKS.forEach((pack, pIdx) => {
      expect(pack.packNumber).toBe(pIdx + 1);
      expect(pack.lectureIds.length).toBe(4);

      pack.lectureIds.forEach((lecId, slotIdx) => {
        expect(seenLectures.has(lecId), `Lecture ${lecId} assigned to multiple packs`).toBe(false);
        seenLectures.add(lecId);

        const lec = LECTURE_MAP.get(lecId);
        expect(lec).toBeDefined();
        expect(lec!.packNumber).toBe(pIdx + 1);
        expect(lec!.packSlot).toBe(slotIdx + 1);
      });
    });

    expect(seenLectures.size).toBe(68);
  });

  it('validates all reference shelf documents parse cleanly with valid internal links', () => {
    expect(documents.length).toBeGreaterThan(10);

    documents.forEach((doc) => {
      expect(doc.id.trim().length).toBeGreaterThan(0);
      expect(doc.title.trim().length).toBeGreaterThan(0);
      expect(doc.text.trim().length).toBeGreaterThan(10);

      // Check linked targets
      Object.entries(doc.links).forEach(([_rawHref, target]) => {
        expect(target).toBeDefined();
        expect(target.kind).toBeDefined();
        if (target.kind === 'document') {
          expect(target.href).toMatch(/^\/read\//);
        }
      });
    });
  });
});
