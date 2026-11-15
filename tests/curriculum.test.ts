import { describe, it, expect } from 'vitest';
import {
  TOPICS,
  ALL_LECTURES,
  MASTERY_PACKS,
  LECTURE_MAP,
  type Topic,
  type Lecture
} from '../src/lib/curriculum';

describe('Curriculum Structure & Academic Invariants', () => {
  it('defines exactly 10 comprehensive foundational topics with sequential numbering', () => {
    expect(TOPICS.length).toBe(10);
    TOPICS.forEach((topic, index) => {
      expect(topic.number).toBe(index + 1);
      expect(topic.id).toBeTruthy();
      expect(topic.title).toBeTruthy();
      expect(topic.description).toBeTruthy();
      expect(topic.lectureIds.length).toBeGreaterThanOrEqual(4);
    });

    const totalTopicLectures = TOPICS.reduce((acc, t) => acc + t.lectureIds.length, 0);
    expect(totalTopicLectures).toBe(60);
  });

  it('contains exactly 60 one-hour lectures across the curriculum', () => {
    expect(ALL_LECTURES.length).toBe(60);
    expect(LECTURE_MAP.size).toBe(60);

    const uniqueIds = new Set(ALL_LECTURES.map(l => l.id));
    expect(uniqueIds.size).toBe(60);
  });

  it('organizes lectures into 15 4-Hour Mastery Packs with 4 slots each', () => {
    expect(MASTERY_PACKS.length).toBe(15);

    MASTERY_PACKS.forEach((pack, packIndex) => {
      expect(pack.packNumber).toBe(packIndex + 1);
      expect(pack.title).toBeTruthy();
      expect(pack.lectureIds.length).toBe(4);

      pack.lectureIds.forEach((lectureId, slotIndex) => {
        const lecture = LECTURE_MAP.get(lectureId);
        expect(lecture).toBeDefined();
        expect(lecture!.packNumber).toBe(packIndex + 1);
        expect(lecture!.packSlot).toBe(slotIndex + 1);
      });
    });
  });

  it('ensures every lecture contains formal theoretical citations and formula references', () => {
    ALL_LECTURES.forEach(lecture => {
      expect(lecture.theoreticalCitations).toBeDefined();
      expect(lecture.theoreticalCitations.length).toBeGreaterThanOrEqual(1);

      lecture.theoreticalCitations.forEach(citation => {
        expect(citation.formulaName.trim().length).toBeGreaterThan(0);
        expect(citation.expression.trim().length).toBeGreaterThan(0);
        expect(citation.source.trim().length).toBeGreaterThan(0);
        expect(citation.theoremOrEquation.trim().length).toBeGreaterThan(0);
      });
    });
  });

  it('ensures every lecture includes complete pedagogical content sections', () => {
    ALL_LECTURES.forEach(lecture => {
      expect(lecture.question.trim().length).toBeGreaterThan(0);
      expect(lecture.subtitle.trim().length).toBeGreaterThan(0);
      expect(lecture.content.motivation.trim().length).toBeGreaterThan(10);
      expect(lecture.content.theory.trim().length).toBeGreaterThan(10);
      expect(lecture.content.workedExample.trim().length).toBeGreaterThan(10);
      expect(lecture.content.codeWalkthrough.trim().length).toBeGreaterThan(10);
      expect(lecture.content.exercise.trim().length).toBeGreaterThan(10);
    });
  });

  it('ensures systems architecture code references and research papers are documented', () => {
    ALL_LECTURES.forEach(lecture => {
      expect(lecture.codeReferences.length).toBeGreaterThanOrEqual(1);
      lecture.codeReferences.forEach(ref => {
        expect(ref.crate).toBeTruthy();
        expect(ref.filePath).toBeTruthy();
        expect(ref.symbols.length).toBeGreaterThan(0);
        expect(ref.purpose).toBeTruthy();
      });

      expect(lecture.paperReferences.length).toBeGreaterThanOrEqual(1);
      lecture.paperReferences.forEach(paper => {
        expect(paper.title).toBeTruthy();
        expect(paper.authors).toBeTruthy();
        expect(paper.citation).toBeTruthy();
        expect(paper.relevantSections).toBeTruthy();
      });
    });
  });
});
