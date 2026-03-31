import type { ViewBox, CutPositions, Part, GridAssignment, PartDefinitions } from "./types";

export const DEFAULT_GRID: GridAssignment = [
  ["corner", "line", "ornament", "line", "corner"],
  ["line",    null,   null,       null,   "line"],
  ["ornament", null,  null,       null,   "ornament"],
  ["line",    null,   null,       null,   "line"],
  ["corner", "line", "ornament", "line", "corner"],
];

export const DEFAULT_PART_DEFS: PartDefinitions = {
  corner:   { row: 0, col: 0 },
  line:     { row: 0, col: 1 },
  ornament: { row: 0, col: 2 },
};

/** Which border cells can be assigned (not inner 3x3) */
export function isBorderCell(row: number, col: number): boolean {
  return row === 0 || row === 4 || col === 0 || col === 4;
}

export function computeDefaultCuts(viewBox: ViewBox): CutPositions {
  const stepX = viewBox.width / 5;
  const stepY = viewBox.height / 5;
  return {
    x: [stepX, stepX * 2, stepX * 3, stepX * 4] as CutPositions["x"],
    y: [stepY, stepY * 2, stepY * 3, stepY * 4] as CutPositions["y"],
  };
}

/** Get the x/y/w/h for a cell at (row, col) in the cut grid */
export function getCellRect(viewBox: ViewBox, cuts: CutPositions, row: number, col: number) {
  const xEdges = [viewBox.x, cuts.x[0], cuts.x[1], cuts.x[2], cuts.x[3], viewBox.x + viewBox.width];
  const yEdges = [viewBox.y, cuts.y[0], cuts.y[1], cuts.y[2], cuts.y[3], viewBox.y + viewBox.height];
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
  defs: PartDefinitions = DEFAULT_PART_DEFS
): { corner: Part; line: Part; ornament: Part } {
  function makePart(def: { row: number; col: number }): Part {
    const r = getCellRect(viewBox, cuts, def.row, def.col);
    return {
      viewBox: `${r.x} ${r.y} ${r.w} ${r.h}`,
      path: pathData,
    };
  }

  return {
    corner: makePart(defs.corner),
    line: makePart(defs.line),
    ornament: makePart(defs.ornament),
  };
}
