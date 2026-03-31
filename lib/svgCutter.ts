import type { ViewBox, CutPositions, Part, GridAssignment, PartDefsMap } from "./types";

export const DEFAULT_GRID_SIZE = 5;

export const DEFAULT_PART_DEFS: PartDefsMap = {
  corner:   { row: 0, col: 0, stretch: false },
  line:     { row: 0, col: 1, stretch: true },
  ornament: { row: 0, col: 2, stretch: false },
};

export function isBorderCell(row: number, col: number, gridSize: number): boolean {
  return row === 0 || row === gridSize - 1 || col === 0 || col === gridSize - 1;
}

export function computeDefaultCuts(viewBox: ViewBox, gridSize: number = DEFAULT_GRID_SIZE): CutPositions {
  const numCuts = gridSize - 1;
  const stepX = viewBox.width / gridSize;
  const stepY = viewBox.height / gridSize;
  return {
    x: Array.from({ length: numCuts }, (_, i) => stepX * (i + 1)),
    y: Array.from({ length: numCuts }, (_, i) => stepY * (i + 1)),
  };
}

export function buildDefaultGrid(gridSize: number): GridAssignment {
  const last = gridSize - 1;
  return Array.from({ length: gridSize }, (_, r) =>
    Array.from({ length: gridSize }, (_, c) => {
      const isBorder = r === 0 || r === last || c === 0 || c === last;
      if (!isBorder) return null;
      const isCornerRow = r === 0 || r === last;
      const isCornerCol = c === 0 || c === last;
      if (isCornerRow && isCornerCol) return "corner";
      return "line";
    })
  );
}

export function getCellRect(viewBox: ViewBox, cuts: CutPositions, row: number, col: number) {
  const xEdges = [viewBox.x, ...cuts.x, viewBox.x + viewBox.width];
  const yEdges = [viewBox.y, ...cuts.y, viewBox.y + viewBox.height];
  return {
    x: xEdges[col],
    y: yEdges[row],
    w: xEdges[col + 1] - xEdges[col],
    h: yEdges[row + 1] - yEdges[row],
  };
}

export function computeParts(
  viewBox: ViewBox,
  cuts: CutPositions,
  pathData: string,
  defs: PartDefsMap = DEFAULT_PART_DEFS
): Record<string, Part> {
  const parts: Record<string, Part> = {};
  for (const [id, def] of Object.entries(defs)) {
    const r = getCellRect(viewBox, cuts, def.row, def.col);
    parts[id] = {
      viewBox: `${r.x} ${r.y} ${r.w} ${r.h}`,
      path: pathData,
    };
  }
  return parts;
}
