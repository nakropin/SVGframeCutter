import { describe, it, expect } from "vitest";
import { computeDefaultCuts, computeParts, buildDefaultGrid, isBorderCell } from "@/lib/svgCutter";
import type { ViewBox, CutPositions } from "@/lib/types";

describe("computeDefaultCuts", () => {
  it("divides viewBox into 5x5 equal zones", () => {
    const viewBox: ViewBox = { x: 0, y: 0, width: 1000, height: 500 };
    const cuts = computeDefaultCuts(viewBox);
    expect(cuts.x).toEqual([200, 400, 600, 800]);
    expect(cuts.y).toEqual([100, 200, 300, 400]);
  });

  it("supports non-square grids (3x1)", () => {
    const viewBox: ViewBox = { x: 0, y: 0, width: 900, height: 100 };
    const cuts = computeDefaultCuts(viewBox, 3, 1);
    expect(cuts.x).toEqual([300, 600]);
    expect(cuts.y).toEqual([]);
  });
});

describe("buildDefaultGrid", () => {
  it("builds a 3x1 grid with only left/right borders", () => {
    const grid = buildDefaultGrid(3, 1);
    expect(grid).toEqual([["line", null, "line"]]);
  });

  it("builds a 1x3 grid with only top/bottom borders", () => {
    const grid = buildDefaultGrid(1, 3);
    expect(grid).toEqual([["line"], [null], ["line"]]);
  });
});

describe("isBorderCell", () => {
  it("only marks col edges as border for 3x1", () => {
    expect(isBorderCell(0, 0, 1, 3)).toBe(true);
    expect(isBorderCell(0, 1, 1, 3)).toBe(false);
    expect(isBorderCell(0, 2, 1, 3)).toBe(true);
  });

  it("only marks row edges as border for 1x3", () => {
    expect(isBorderCell(0, 0, 3, 1)).toBe(true);
    expect(isBorderCell(1, 0, 3, 1)).toBe(false);
    expect(isBorderCell(2, 0, 3, 1)).toBe(true);
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
