import { describe, it, expect } from "vitest";
import { computeDefaultCuts, computeParts } from "@/lib/svgCutter";
import type { ViewBox, CutPositions } from "@/lib/types";

describe("computeDefaultCuts", () => {
  it("divides viewBox into 5 equal zones", () => {
    const viewBox: ViewBox = { x: 0, y: 0, width: 1000, height: 500 };
    const cuts = computeDefaultCuts(viewBox);
    expect(cuts.x).toEqual([200, 400, 600, 800]);
    expect(cuts.y).toEqual([100, 200, 300, 400]);
  });
});

describe("computeParts", () => {
  const viewBox: ViewBox = { x: 0, y: 0, width: 1000, height: 500 };
  const cuts: CutPositions = {
    x: [200, 400, 600, 800],
    y: [100, 200, 300, 400],
  };
  const pathData = "M0,0v500h1000V0H0Z";

  it("computes corner part with correct viewBox", () => {
    const parts = computeParts(viewBox, cuts, pathData);
    expect(parts.corner.viewBox).toBe("0 0 200 100");
    expect(parts.corner.path).toBe(pathData);
  });

  it("computes line part with correct viewBox", () => {
    const parts = computeParts(viewBox, cuts, pathData);
    expect(parts.line.viewBox).toBe("200 0 200 100");
    expect(parts.line.path).toBe(pathData);
  });

  it("computes ornament part with correct viewBox", () => {
    const parts = computeParts(viewBox, cuts, pathData);
    expect(parts.ornament.viewBox).toBe("400 0 200 100");
    expect(parts.ornament.path).toBe(pathData);
  });
});
