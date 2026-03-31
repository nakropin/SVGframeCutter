import { describe, it, expect } from "vitest";
import { buildFrameConfig, serializeConfig, deserializeConfig } from "@/lib/frameConfig";
import type { SvgData, CutPositions } from "@/lib/types";

describe("buildFrameConfig", () => {
  const svgData: SvgData = {
    viewBox: { x: 0, y: 0, width: 1000, height: 500 },
    paths: ["M0,0v500h1000V0H0Z"],
    fill: "#fff",
  };
  const cuts: CutPositions = {
    x: [200, 400, 600, 800],
    y: [100, 200, 300, 400],
  };

  it("builds a complete FrameConfig", () => {
    const config = buildFrameConfig("TestFrame", svgData, cuts);
    expect(config.name).toBe("TestFrame");
    expect(config.sourceViewBox).toEqual(svgData.viewBox);
    expect(config.cuts).toEqual(cuts);
    expect(config.parts.corner).toBeDefined();
    expect(config.parts.line).toBeDefined();
    expect(config.parts.ornament).toBeDefined();
  });
});

describe("serialize/deserialize", () => {
  it("round-trips a config through JSON", () => {
    const svgData: SvgData = {
      viewBox: { x: 0, y: 0, width: 1000, height: 500 },
      paths: ["M0,0v500h1000V0H0Z"],
      fill: "#fff",
    };
    const cuts: CutPositions = {
      x: [200, 400, 600, 800],
      y: [100, 200, 300, 400],
    };
    const config = buildFrameConfig("TestFrame", svgData, cuts);
    const json = serializeConfig(config);
    const restored = deserializeConfig(json);
    expect(restored).toEqual(config);
  });
});
