import type { FrameConfig, SvgData, CutPositions } from "./types";
import { computeParts } from "./svgCutter";

export function buildFrameConfig(
  name: string,
  svgData: SvgData,
  cuts: CutPositions
): FrameConfig {
  const combinedPath = svgData.paths.join(" ");
  const parts = computeParts(svgData.viewBox, cuts, combinedPath);

  return {
    name,
    sourceViewBox: svgData.viewBox,
    cuts,
    parts,
  };
}

export function serializeConfig(config: FrameConfig): string {
  return JSON.stringify(config, null, 2);
}

export function deserializeConfig(json: string): FrameConfig {
  return JSON.parse(json) as FrameConfig;
}
