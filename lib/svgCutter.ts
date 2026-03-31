import type { ViewBox, CutPositions, Part, GridAssignment, PartDefsMap } from "./types";

export const DEFAULT_GRID_COLS = 5;
export const DEFAULT_GRID_ROWS = 5;
/** @deprecated use DEFAULT_GRID_COLS / DEFAULT_GRID_ROWS */
export const DEFAULT_GRID_SIZE = 5;

export const DEFAULT_PART_DEFS: PartDefsMap = {
  corner:   { row: 0, col: 0, stretch: false },
  line:     { row: 0, col: 1, stretch: true },
  ornament: { row: 0, col: 2, stretch: false },
};

export function isBorderCell(row: number, col: number, rows: number, cols: number): boolean {
  const onRow = rows > 1 && (row === 0 || row === rows - 1);
  const onCol = cols > 1 && (col === 0 || col === cols - 1);
  return onRow || onCol;
}

export function computeDefaultCuts(viewBox: ViewBox, cols: number = DEFAULT_GRID_COLS, rows: number = DEFAULT_GRID_ROWS): CutPositions {
  const stepX = viewBox.width / cols;
  const stepY = viewBox.height / rows;
  return {
    x: Array.from({ length: cols - 1 }, (_, i) => stepX * (i + 1)),
    y: Array.from({ length: rows - 1 }, (_, i) => stepY * (i + 1)),
  };
}

export function buildDefaultGrid(cols: number, rows: number): GridAssignment {
  const lastR = rows - 1;
  const lastC = cols - 1;
  return Array.from({ length: rows }, (_, r) =>
    Array.from({ length: cols }, (_, c) => {
      // Single-axis grids: edges of the active axis are corners, rest is line
      if (rows === 1 || cols === 1) {
        const isColEdge = cols > 1 && (c === 0 || c === lastC);
        const isRowEdge = rows > 1 && (r === 0 || r === lastR);
        return (isColEdge || isRowEdge) ? "corner" : "line";
      }
      if (!isBorderCell(r, c, rows, cols)) return null;
      const isCornerRow = r === 0 || r === lastR;
      const isCornerCol = c === 0 || c === lastC;
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
  defs: PartDefsMap = DEFAULT_PART_DEFS,
  transform?: string
): Record<string, Part> {
  const parts: Record<string, Part> = {};
  for (const [id, def] of Object.entries(defs)) {
    const r = getCellRect(viewBox, cuts, def.row, def.col);
    parts[id] = {
      viewBox: `${r.x} ${r.y} ${r.w} ${r.h}`,
      path: pathData,
      transform,
    };
  }
  return parts;
}
