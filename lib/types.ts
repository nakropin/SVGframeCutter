export interface ViewBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CutPositions {
  x: [number, number, number, number];
  y: [number, number, number, number];
}

export interface Part {
  viewBox: string;
  path: string;
}

/** Definition of a single part type */
export interface PartDef {
  row: number;     // canonical zone row
  col: number;     // canonical zone col
  stretch: boolean; // true = stretches to fill (like lines), false = preserves aspect ratio
}

/** All part definitions keyed by part ID */
export type PartDefsMap = Record<string, PartDef>;

/** 5x5 grid assignment. null = empty, string = part ID */
export type GridAssignment = (string | null)[][];

export interface FrameConfig {
  name: string;
  sourceViewBox: ViewBox;
  cuts: CutPositions;
  grid: GridAssignment;
  partDefs: PartDefsMap;
  parts: Record<string, Part>;
}

export interface SvgData {
  viewBox: ViewBox;
  paths: string[];
  fill: string;
}
