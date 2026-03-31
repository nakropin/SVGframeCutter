export interface ViewBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CutPositions {
  x: [number, number, number, number]; // cut1..cut4 along horizontal axis
  y: [number, number, number, number]; // cut1..cut4 along vertical axis
}

export interface Part {
  viewBox: string; // "x y w h" format for SVG viewBox attribute
  path: string;    // SVG path d attribute
}

export type PartType = "corner" | "line" | "ornament";

// Which zone (row,col) in the 5x5 cut grid defines each part's clip region
export interface PartDefinitions {
  corner: { row: number; col: number };
  line: { row: number; col: number };
  ornament: { row: number; col: number };
}

// 5x5 grid assignment. null = empty (inner content area or unassigned border cell)
// Row-major: grid[row][col]
export type GridAssignment = (PartType | null)[][];

export interface FrameConfig {
  name: string;
  sourceViewBox: ViewBox;
  cuts: CutPositions;
  grid: GridAssignment;
  parts: {
    corner: Part;
    line: Part;
    ornament: Part;
  };
}

export interface SvgData {
  viewBox: ViewBox;
  paths: string[];   // all <path> d attributes found in the SVG
  fill: string;       // fill color from the SVG (e.g., "#fff")
}
