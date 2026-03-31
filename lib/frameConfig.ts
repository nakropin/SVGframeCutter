import type { FrameConfig, SvgData, CutPositions, GridAssignment, PartDefsMap } from "./types";
import { computeParts, buildDefaultGrid, DEFAULT_PART_DEFS, DEFAULT_GRID_SIZE } from "./svgCutter";

export function buildFrameConfig(
  name: string,
  svgData: SvgData,
  cuts: CutPositions,
  grid: GridAssignment = buildDefaultGrid(DEFAULT_GRID_SIZE),
  defs: PartDefsMap = DEFAULT_PART_DEFS,
  gridSize: number = DEFAULT_GRID_SIZE
): FrameConfig {
  const combinedPath = svgData.paths.map(p => p.d).join(" ");
  const commonTransform = svgData.paths[0]?.transform;
  const parts = computeParts(svgData.viewBox, cuts, combinedPath, defs, commonTransform);

  return {
    name,
    sourceViewBox: svgData.viewBox,
    gridSize,
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
