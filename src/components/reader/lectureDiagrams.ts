import type { DiagramSpec } from './DiagramWidget';
import { CIRCUIT_DIAGRAMS } from './lectureDiagramsCircuits';
import { FOUNDATION_DIAGRAMS } from './lectureDiagramsFoundations';
import { SIMULATION_DIAGRAMS } from './lectureDiagramsSimulation';

export const LECTURE_DIAGRAMS: Partial<Record<string, DiagramSpec>> = {
  ...FOUNDATION_DIAGRAMS,
  ...CIRCUIT_DIAGRAMS,
  ...SIMULATION_DIAGRAMS
};
