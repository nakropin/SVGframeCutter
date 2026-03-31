export interface ViewBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CutPositions {
  x: number[]; // G-1 cuts along horizontal axis (G = grid size)
  y: number[]; // G-1 cuts along vertical axis
}

export interface PathData {
  d: string;
  transform?: string;
}

export interface Part {
  viewBox: string;
  path: string;
  transform?: string;
}

export interface PartDef {
  row: number;
  col: number;
  stretch: boolean;
}

export type PartDefsMap = Record<string, PartDef>;

/** NxN grid assignment. null = empty, string = part ID */
export type GridAssignment = (string | null)[][];

export interface FrameConfig {
  name: string;
  sourceViewBox: ViewBox;
  gridSize: number;
  cuts: CutPositions;
  grid: GridAssignment;
  partDefs: PartDefsMap;
  parts: Record<string, Part>;
}

export interface SvgData {
  viewBox: ViewBox;
  paths: PathData[];
  fill: string;
}
