import type { FrameConfig, SvgData, CutPositions, GridAssignment, PartDefinitions } from "./types";
import { computeParts, DEFAULT_GRID, DEFAULT_PART_DEFS } from "./svgCutter";

export function buildFrameConfig(
  name: string,
  svgData: SvgData,
  cuts: CutPositions,
  grid: GridAssignment = DEFAULT_GRID,
  defs: PartDefinitions = DEFAULT_PART_DEFS
): FrameConfig {
  const combinedPath = svgData.paths.join(" ");
  const parts = computeParts(svgData.viewBox, cuts, combinedPath, defs);

  return {
    name,
    sourceViewBox: svgData.viewBox,
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
