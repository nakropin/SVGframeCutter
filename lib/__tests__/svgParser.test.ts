import { describe, it, expect } from "vitest";
import { parseSvgString } from "@/lib/svgParser";

const SIMPLE_SVG = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 912 612">
  <defs><style>.cls-1{fill:#fff;}</style></defs>
  <path class="cls-1" d="M0,0v612h912V0H0Z"/>
</svg>`;

const MULTI_PATH_SVG = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 200">
  <path d="M0,0L100,0"/>
  <path d="M0,200L100,200"/>
</svg>`;

const TRANSFORMED_SVG = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <g transform="translate(10,20)">
    <path d="M0,0L100,100"/>
  </g>
</svg>`;

describe("parseSvgString", () => {
  it("extracts viewBox dimensions", () => {
    const result = parseSvgString(SIMPLE_SVG);
    expect(result.viewBox).toEqual({ x: 0, y: 0, width: 912, height: 612 });
  });

  it("extracts path d attributes", () => {
    const result = parseSvgString(SIMPLE_SVG);
    expect(result.paths).toEqual([{ d: "M0,0v612h912V0H0Z" }]);
  });

  it("extracts multiple paths", () => {
    const result = parseSvgString(MULTI_PATH_SVG);
    expect(result.paths).toHaveLength(2);
    expect(result.paths[0].d).toBe("M0,0L100,0");
    expect(result.paths[1].d).toBe("M0,200L100,200");
  });

  it("extracts ancestor transforms", () => {
    const result = parseSvgString(TRANSFORMED_SVG);
    expect(result.paths).toHaveLength(1);
    expect(result.paths[0].d).toBe("M0,0L100,100");
    expect(result.paths[0].transform).toBe("translate(10,20)");
  });

  it("omits transform when none present", () => {
    const result = parseSvgString(SIMPLE_SVG);
    expect(result.paths[0].transform).toBeUndefined();
  });

  it("extracts fill color from style", () => {
    const result = parseSvgString(SIMPLE_SVG);
    expect(result.fill).toBe("#fff");
  });

  it("defaults fill to white when no style found", () => {
    const result = parseSvgString(MULTI_PATH_SVG);
    expect(result.fill).toBe("#ffffff");
  });
});
