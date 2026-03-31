import type { FrameConfig, SvgData, CutPositions, GridAssignment, PartDefsMap } from "./types";
import { computeParts, buildDefaultGrid, DEFAULT_PART_DEFS, DEFAULT_GRID_COLS, DEFAULT_GRID_ROWS } from "./svgCutter";

export function buildFrameConfig(
  name: string,
  svgData: SvgData,
  cuts: CutPositions,
  grid: GridAssignment = buildDefaultGrid(DEFAULT_GRID_COLS, DEFAULT_GRID_ROWS),
  defs: PartDefsMap = DEFAULT_PART_DEFS,
  cols: number = DEFAULT_GRID_COLS,
  rows: number = DEFAULT_GRID_ROWS
): FrameConfig {
  const combinedPath = svgData.paths.map(p => p.d).join(" ");
  const commonTransform = svgData.paths[0]?.transform;
  const parts = computeParts(svgData.viewBox, cuts, combinedPath, defs, commonTransform);

  return {
    name,
    sourceViewBox: svgData.viewBox,
    gridCols: cols,
    gridRows: rows,
    cuts,
    grid,
    partDefs: defs,
    parts,
  };
}

export function serializeConfig(config: FrameConfig): string {
  return JSON.stringify(config, null, 2);
}

export function deserializeConfig(json: string): FrameConfig {
  return JSON.parse(json) as FrameConfig;
}
