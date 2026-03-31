import type { ViewBox, CutPositions, Part } from "./types";

export function computeDefaultCuts(viewBox: ViewBox): CutPositions {
  const stepX = viewBox.width / 5;
  const stepY = viewBox.height / 5;
  return {
    x: [stepX, stepX * 2, stepX * 3, stepX * 4] as CutPositions["x"],
    y: [stepY, stepY * 2, stepY * 3, stepY * 4] as CutPositions["y"],
  };
}

export function computeParts(
  viewBox: ViewBox,
  cuts: CutPositions,
  pathData: string
): { corner: Part; line: Part; ornament: Part } {
  // Corner: from left edge to cut1 (x), top edge to cut1 (y)
  const cornerW = cuts.x[0] - viewBox.x;
  const cornerH = cuts.y[0] - viewBox.y;

  // Line: from cut1 to cut2 (x), top edge to cut1 (y)
  const lineW = cuts.x[1] - cuts.x[0];
  const lineH = cornerH;

  // Ornament: from cut2 to cut3 (x), top edge to cut1 (y)
  const ornamentW = cuts.x[2] - cuts.x[1];
  const ornamentH = cornerH;

  return {
    corner: {
      viewBox: `${viewBox.x} ${viewBox.y} ${cornerW} ${cornerH}`,
      path: pathData,
    },
    line: {
      viewBox: `${cuts.x[0]} ${viewBox.y} ${lineW} ${lineH}`,
      path: pathData,
    },
    ornament: {
      viewBox: `${cuts.x[1]} ${viewBox.y} ${ornamentW} ${ornamentH}`,
      path: pathData,
    },
  };
}
