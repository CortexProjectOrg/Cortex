import type { PaperAnalysis } from '../../src/lib/paperPlan';

export const sourcePaper =
  'Example paper: Inverses of maps. Theorem 1: Every bijective map has a unique inverse. Proof: existence follows from surjectivity, and uniqueness of each preimage follows from injectivity.';
export const paperAnalysis: PaperAnalysis = {
  paperTitle: 'Inverses of maps',
  theorem: {
    title: 'Theorem 1',
    statement: 'Every bijective map has a unique inverse.',
    location: 'Theorem 1',
    quote: 'Every bijective map has a unique inverse.',
    prerequisites: ['bijections']
  },
  explanation: 'A path through functions and bijections.',
  concepts: [
    {
      id: 'maps',
      title: 'Maps',
      topic: 'Set theory',
      reason: 'The theorem concerns functions between sets.',
      source: 'Background prerequisite (inferred)',
      evidence: '',
      prerequisites: [],
      objectives: ['Distinguish domain and codomain.'],
      explanation: 'A map assigns exactly one output to each input.',
      example: 'The map n ↦ n + 1 has inverse n ↦ n − 1 on integers.',
      exercise: 'Find the image of the integers under n ↦ 2n.',
      difficulty: 1,
      practiceMinutes: 5
    },
    {
      id: 'bijections',
      title: 'Bijections and inverse functions',
      topic: 'Set theory',
      reason: 'Both injectivity and surjectivity are needed for an inverse.',
      source: 'Theorem 1',
      evidence: 'Every bijective map has a unique inverse.',
      prerequisites: ['maps'],
      objectives: ['Prove that an inverse exists.', 'Prove its uniqueness.'],
      explanation: 'A bijection is injective and surjective. Each output therefore has exactly one preimage.',
      example: 'Translation on integers is a bijection; doubling is injective but not onto.',
      exercise: 'Prove the inverse of a bijection is bijective.',
      difficulty: 2,
      practiceMinutes: 15
    }
  ]
};
