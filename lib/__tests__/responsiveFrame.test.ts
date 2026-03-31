import { describe, it, expect } from "vitest";
import { getTransformForPosition } from "@/components/frame/ResponsiveFrame";

describe("getTransformForPosition", () => {
  it("returns no transform for top-left corner", () => {
    expect(getTransformForPosition("top-left")).toBe("");
  });

  it("returns scaleX(-1) for top-right corner", () => {
    expect(getTransformForPosition("top-right")).toBe("scaleX(-1)");
  });

  it("returns scaleY(-1) for bottom-left corner", () => {
    expect(getTransformForPosition("bottom-left")).toBe("scaleY(-1)");
  });

  it("returns scale(-1,-1) for bottom-right corner", () => {
    expect(getTransformForPosition("bottom-right")).toBe("scale(-1,-1)");
  });

  it("returns no transform for top line", () => {
    expect(getTransformForPosition("top")).toBe("");
  });

  it("returns rotate(90) for right line", () => {
    expect(getTransformForPosition("right")).toBe("rotate(90)");
  });

  it("returns scaleY(-1) for bottom line", () => {
    expect(getTransformForPosition("bottom")).toBe("scaleY(-1)");
  });

  it("returns rotate(-90) for left line", () => {
    expect(getTransformForPosition("left")).toBe("rotate(-90)");
  });
});
