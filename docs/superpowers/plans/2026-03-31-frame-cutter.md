# frameCutter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Next.js app that decomposes ornamental SVG frames into responsive parts (corner, line, ornament) via an interactive cutter UI with live frame preview.

**Architecture:** Two integrated panels — a cutter (SVG canvas with draggable cut lines + numeric controls + parts preview) and a responsive frame preview. The frame component uses a 5x5 CSS grid where corners/ornaments scale uniformly and lines stretch. All frame data exports as a single JSON config.

**Tech Stack:** Next.js (App Router), TypeScript, Tailwind CSS

---

## File Structure

```
frameCutter/
├── app/
│   ├── layout.tsx            — Root layout, dark theme, font setup
│   ├── page.tsx              — Main page: state management, cutter + preview panels
│   └── globals.css           — Tailwind directives + dark theme base styles
├── components/
│   ├── cutter/
│   │   ├── SvgCanvas.tsx     — SVG display with draggable cut line overlays
│   │   ├── CutControls.tsx   — 8 numeric inputs (4x X, 4x Y), synced with canvas
│   │   └── PartsPreview.tsx  — Renders 3 clipped parts for visual verification
│   ├── frame/
│   │   ├── ResponsiveFrame.tsx  — 5x5 grid frame component (the exportable product)
│   │   └── FramePreview.tsx     — Wraps ResponsiveFrame with thickness/size sliders
│   └── ui/
│       └── Slider.tsx        — Reusable range slider with label + value display
├── lib/
│   ├── types.ts              — Shared TypeScript types (FrameConfig, CutPositions, Part)
│   ├── svgParser.ts          — Parse SVG string, extract path data + viewBox dimensions
│   ├── svgCutter.ts          — Compute clipped parts from path + cut positions
│   └── frameConfig.ts        — Build FrameConfig JSON, serialize/deserialize
├── public/
│   └── frames/
│       └── WindowFrame8.svg  — Example frame for testing
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── next.config.ts
```

---

### Task 1: Project Scaffolding

**Files:**
- Create: `package.json`, `tsconfig.json`, `tailwind.config.ts`, `next.config.ts`, `app/layout.tsx`, `app/globals.css`, `app/page.tsx`
- Create: `public/frames/WindowFrame8.svg`

- [ ] **Step 1: Initialize Next.js project**

Run:
```bash
cd /Users/nikita/Documents/Dev/frameCutter
npx create-next-app@latest . --typescript --tailwind --eslint --app --src=no --import-alias="@/*" --use-npm
```

Expected: Project scaffolded with Next.js, TypeScript, Tailwind, App Router.

- [ ] **Step 2: Copy example SVG into public/frames**

Run:
```bash
mkdir -p /Users/nikita/Documents/Dev/frameCutter/public/frames
cp /Users/nikita/Documents/Business/eisenxgrind/FantasyGothicUI/SVG/WindowFrame8.svg /Users/nikita/Documents/Dev/frameCutter/public/frames/WindowFrame8.svg
```

- [ ] **Step 3: Set up dark theme base styles**

Replace `app/globals.css` with:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --background: #0a0a0a;
  --foreground: #e5e5e5;
  --muted: #404040;
  --accent: #22d3ee;
}

body {
  background: var(--background);
  color: var(--foreground);
}
```

- [ ] **Step 4: Set up root layout**

Replace `app/layout.tsx` with:

```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "frameCutter",
  description: "Decompose ornamental SVG frames into responsive parts",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
```

- [ ] **Step 5: Create placeholder page**

Replace `app/page.tsx` with:

```tsx
export default function Home() {
  return (
    <main className="flex h-screen items-center justify-center">
      <h1 className="text-2xl font-mono">frameCutter</h1>
    </main>
  );
}
```

- [ ] **Step 6: Verify dev server starts**

Run:
```bash
cd /Users/nikita/Documents/Dev/frameCutter && npm run dev
```

Expected: Server starts on localhost:3000, page shows "frameCutter" centered on dark background.

- [ ] **Step 7: Commit**

```bash
git init
echo "node_modules/\n.next/\n.env*.local" > .gitignore
git add -A
git commit -m "feat: scaffold Next.js project with dark theme"
```

---

### Task 2: Shared Types

**Files:**
- Create: `lib/types.ts`

- [ ] **Step 1: Define all shared types**

Create `lib/types.ts`:

```ts
export interface ViewBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CutPositions {
  x: [number, number, number, number]; // cut1..cut4 along horizontal axis
  y: [number, number, number, number]; // cut1..cut4 along vertical axis
}

export interface Part {
  viewBox: string; // "x y w h" format for SVG viewBox attribute
  path: string;    // SVG path d attribute
}

export interface FrameConfig {
  name: string;
  sourceViewBox: ViewBox;
  cuts: CutPositions;
  parts: {
    corner: Part;
    line: Part;
    ornament: Part;
  };
}

export interface SvgData {
  viewBox: ViewBox;
  paths: string[];   // all <path> d attributes found in the SVG
  fill: string;       // fill color from the SVG (e.g., "#fff")
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/types.ts
git commit -m "feat: add shared TypeScript types for frame config"
```

---

### Task 3: SVG Parser

**Files:**
- Create: `lib/svgParser.ts`
- Create: `lib/__tests__/svgParser.test.ts`

- [ ] **Step 1: Install vitest**

Run:
```bash
cd /Users/nikita/Documents/Dev/frameCutter && npm install -D vitest @vitejs/plugin-react
```

Add to `package.json` scripts:
```json
"test": "vitest run",
"test:watch": "vitest"
```

Create `vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
```

- [ ] **Step 2: Write failing test for SVG parsing**

Create `lib/__tests__/svgParser.test.ts`:

```ts
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

describe("parseSvgString", () => {
  it("extracts viewBox dimensions", () => {
    const result = parseSvgString(SIMPLE_SVG);
    expect(result.viewBox).toEqual({ x: 0, y: 0, width: 912, height: 612 });
  });

  it("extracts path d attributes", () => {
    const result = parseSvgString(SIMPLE_SVG);
    expect(result.paths).toEqual(["M0,0v612h912V0H0Z"]);
  });

  it("extracts multiple paths", () => {
    const result = parseSvgString(MULTI_PATH_SVG);
    expect(result.paths).toHaveLength(2);
    expect(result.paths[0]).toBe("M0,0L100,0");
    expect(result.paths[1]).toBe("M0,200L100,200");
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
```

- [ ] **Step 3: Run test to verify it fails**

Run: `cd /Users/nikita/Documents/Dev/frameCutter && npm test -- lib/__tests__/svgParser.test.ts`

Expected: FAIL — `parseSvgString` not found.

- [ ] **Step 4: Implement svgParser**

Create `lib/svgParser.ts`:

```ts
import type { SvgData } from "./types";

export function parseSvgString(svgString: string): SvgData {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgString, "image/svg+xml");
  const svgEl = doc.querySelector("svg");

  if (!svgEl) {
    throw new Error("No <svg> element found");
  }

  // Parse viewBox
  const viewBoxAttr = svgEl.getAttribute("viewBox") ?? "0 0 0 0";
  const [x, y, width, height] = viewBoxAttr.split(/\s+/).map(Number);

  // Extract all path d attributes
  const pathEls = doc.querySelectorAll("path");
  const paths: string[] = [];
  for (const p of pathEls) {
    const d = p.getAttribute("d");
    if (d) paths.push(d);
  }

  // Extract fill from <style> or path attributes
  let fill = "#ffffff";
  const styleEl = doc.querySelector("style");
  if (styleEl?.textContent) {
    const fillMatch = styleEl.textContent.match(/fill:\s*(#[0-9a-fA-F]+)/);
    if (fillMatch) fill = fillMatch[1];
  }

  return { viewBox: { x, y, width, height }, paths, fill };
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd /Users/nikita/Documents/Dev/frameCutter && npm test -- lib/__tests__/svgParser.test.ts`

Expected: All 5 tests PASS.

Note: If `DOMParser` is not available in vitest's node environment, install `jsdom`:
```bash
npm install -D jsdom
```
And update `vitest.config.ts`:
```ts
export default defineConfig({
  test: {
    environment: "jsdom",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
```

- [ ] **Step 6: Commit**

```bash
git add lib/svgParser.ts lib/__tests__/svgParser.test.ts vitest.config.ts package.json package-lock.json
git commit -m "feat: SVG parser with viewBox, paths, and fill extraction"
```

---

### Task 4: SVG Cutter Logic

**Files:**
- Create: `lib/svgCutter.ts`
- Create: `lib/__tests__/svgCutter.test.ts`

- [ ] **Step 1: Write failing tests for cut computation**

Create `lib/__tests__/svgCutter.test.ts`:

```ts
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd /Users/nikita/Documents/Dev/frameCutter && npm test -- lib/__tests__/svgCutter.test.ts`

Expected: FAIL — modules not found.

- [ ] **Step 3: Implement svgCutter**

Create `lib/svgCutter.ts`:

```ts
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd /Users/nikita/Documents/Dev/frameCutter && npm test -- lib/__tests__/svgCutter.test.ts`

Expected: All 4 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/svgCutter.ts lib/__tests__/svgCutter.test.ts
git commit -m "feat: SVG cutter with default cuts and part computation"
```

---

### Task 5: Frame Config Export/Import

**Files:**
- Create: `lib/frameConfig.ts`
- Create: `lib/__tests__/frameConfig.test.ts`

- [ ] **Step 1: Write failing tests**

Create `lib/__tests__/frameConfig.test.ts`:

```ts
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd /Users/nikita/Documents/Dev/frameCutter && npm test -- lib/__tests__/frameConfig.test.ts`

Expected: FAIL — modules not found.

- [ ] **Step 3: Implement frameConfig**

Create `lib/frameConfig.ts`:

```ts
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd /Users/nikita/Documents/Dev/frameCutter && npm test -- lib/__tests__/frameConfig.test.ts`

Expected: All 2 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/frameConfig.ts lib/__tests__/frameConfig.test.ts
git commit -m "feat: frame config build, serialize, and deserialize"
```

---

### Task 6: Slider UI Component

**Files:**
- Create: `components/ui/Slider.tsx`

- [ ] **Step 1: Create Slider component**

Create `components/ui/Slider.tsx`:

```tsx
"use client";

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
}

export function Slider({ label, value, min, max, step = 1, onChange }: SliderProps) {
  return (
    <div className="flex items-center gap-3">
      <label className="text-sm text-neutral-400 w-20 shrink-0">{label}</label>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="flex-1 accent-cyan-400"
      />
      <input
        type="number"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-20 bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-sm text-right"
      />
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/ui/Slider.tsx
git commit -m "feat: reusable Slider component with range + numeric input"
```

---

### Task 7: Responsive Frame Component

**Files:**
- Create: `components/frame/ResponsiveFrame.tsx`

- [ ] **Step 1: Write failing test**

Create `lib/__tests__/responsiveFrame.test.ts`:

```ts
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd /Users/nikita/Documents/Dev/frameCutter && npm test -- lib/__tests__/responsiveFrame.test.ts`

Expected: FAIL — module not found.

- [ ] **Step 3: Implement ResponsiveFrame**

Create `components/frame/ResponsiveFrame.tsx`:

```tsx
"use client";

import type { FrameConfig } from "@/lib/types";

type CornerPosition = "top-left" | "top-right" | "bottom-left" | "bottom-right";
type SidePosition = "top" | "right" | "bottom" | "left";
type Position = CornerPosition | SidePosition;

export function getTransformForPosition(position: Position): string {
  const transforms: Record<Position, string> = {
    "top-left": "",
    "top-right": "scaleX(-1)",
    "bottom-left": "scaleY(-1)",
    "bottom-right": "scale(-1,-1)",
    top: "",
    right: "rotate(90)",
    bottom: "scaleY(-1)",
    left: "rotate(-90)",
  };
  return transforms[position];
}

interface FramePartProps {
  viewBox: string;
  path: string;
  fill: string;
  transform?: string;
  preserveAspectRatio?: string;
}

function FramePart({ viewBox, path, fill, transform, preserveAspectRatio = "xMidYMid meet" }: FramePartProps) {
  return (
    <svg
      viewBox={viewBox}
      preserveAspectRatio={preserveAspectRatio}
      className="w-full h-full block"
      style={{ transform }}
    >
      <path d={path} fill={fill} />
    </svg>
  );
}

interface ResponsiveFrameProps {
  config: FrameConfig;
  thickness?: number;
  fill?: string;
  className?: string;
  children?: React.ReactNode;
}

export function ResponsiveFrame({
  config,
  thickness = 60,
  fill = "#fff",
  className = "",
  children,
}: ResponsiveFrameProps) {
  const { corner, line, ornament } = config.parts;
  const t = `${thickness}px`;

  return (
    <div
      className={`grid ${className}`}
      style={{
        gridTemplateColumns: `${t} 1fr ${t} 1fr ${t}`,
        gridTemplateRows: `${t} 1fr ${t} 1fr ${t}`,
      }}
    >
      {/* Row 1: top-left corner | top-line | top-ornament | top-line | top-right corner */}
      <FramePart viewBox={corner.viewBox} path={corner.path} fill={fill} transform={getTransformForPosition("top-left")} />
      <FramePart viewBox={line.viewBox} path={line.path} fill={fill} preserveAspectRatio="none" transform={getTransformForPosition("top")} />
      <FramePart viewBox={ornament.viewBox} path={ornament.path} fill={fill} transform={getTransformForPosition("top")} />
      <FramePart viewBox={line.viewBox} path={line.path} fill={fill} preserveAspectRatio="none" transform={getTransformForPosition("top")} />
      <FramePart viewBox={corner.viewBox} path={corner.path} fill={fill} transform={getTransformForPosition("top-right")} />

      {/* Row 2: left-line | empty | empty | empty | right-line */}
      <FramePart viewBox={line.viewBox} path={line.path} fill={fill} preserveAspectRatio="none" transform={getTransformForPosition("left")} />
      <div />
      <div />
      <div />
      <FramePart viewBox={line.viewBox} path={line.path} fill={fill} preserveAspectRatio="none" transform={getTransformForPosition("right")} />

      {/* Row 3: left-ornament | empty | content | empty | right-ornament */}
      <FramePart viewBox={ornament.viewBox} path={ornament.path} fill={fill} transform={getTransformForPosition("left")} />
      <div />
      <div className="flex items-center justify-center overflow-auto" style={{ gridColumn: "2 / 5", gridRow: "2 / 5" }}>
        {children}
      </div>
      <div />
      <FramePart viewBox={ornament.viewBox} path={ornament.path} fill={fill} transform={getTransformForPosition("right")} />

      {/* Row 4: left-line | empty | empty | empty | right-line */}
      <FramePart viewBox={line.viewBox} path={line.path} fill={fill} preserveAspectRatio="none" transform={getTransformForPosition("left")} />
      <div />
      <div />
      <div />
      <FramePart viewBox={line.viewBox} path={line.path} fill={fill} preserveAspectRatio="none" transform={getTransformForPosition("right")} />

      {/* Row 5: bottom-left corner | bottom-line | bottom-ornament | bottom-line | bottom-right corner */}
      <FramePart viewBox={corner.viewBox} path={corner.path} fill={fill} transform={getTransformForPosition("bottom-left")} />
      <FramePart viewBox={line.viewBox} path={line.path} fill={fill} preserveAspectRatio="none" transform={getTransformForPosition("bottom")} />
      <FramePart viewBox={ornament.viewBox} path={ornament.path} fill={fill} transform={getTransformForPosition("bottom")} />
      <FramePart viewBox={line.viewBox} path={line.path} fill={fill} preserveAspectRatio="none" transform={getTransformForPosition("bottom")} />
      <FramePart viewBox={corner.viewBox} path={corner.path} fill={fill} transform={getTransformForPosition("bottom-right")} />
    </div>
  );
}
```

Note: The content `div` uses `gridColumn: "2 / 5"` and `gridRow: "2 / 5"` to span the inner 3x3 area, overlapping the empty divs. This lets the content fill the full interior.

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd /Users/nikita/Documents/Dev/frameCutter && npm test -- lib/__tests__/responsiveFrame.test.ts`

Expected: All 8 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add components/frame/ResponsiveFrame.tsx lib/__tests__/responsiveFrame.test.ts
git commit -m "feat: ResponsiveFrame component with 5x5 CSS grid layout"
```

---

### Task 8: SVG Canvas with Draggable Cut Lines

**Files:**
- Create: `components/cutter/SvgCanvas.tsx`

- [ ] **Step 1: Implement SvgCanvas**

Create `components/cutter/SvgCanvas.tsx`:

```tsx
"use client";

import { useCallback, useRef, useState } from "react";
import type { SvgData, CutPositions } from "@/lib/types";

interface SvgCanvasProps {
  svgData: SvgData;
  cuts: CutPositions;
  onCutsChange: (cuts: CutPositions) => void;
}

type DragTarget = { axis: "x" | "y"; index: number } | null;

export function SvgCanvas({ svgData, cuts, onCutsChange }: SvgCanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dragTarget, setDragTarget] = useState<DragTarget>(null);
  const [hoverTarget, setHoverTarget] = useState<DragTarget>(null);

  const { viewBox } = svgData;
  const vbString = `${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`;

  const svgPointFromEvent = useCallback(
    (e: React.MouseEvent): { x: number; y: number } | null => {
      const svg = svgRef.current;
      if (!svg) return null;
      const pt = svg.createSVGPoint();
      pt.x = e.clientX;
      pt.y = e.clientY;
      const ctm = svg.getScreenCTM();
      if (!ctm) return null;
      const svgPt = pt.matrixTransform(ctm.inverse());
      return { x: svgPt.x, y: svgPt.y };
    },
    []
  );

  const handleMouseDown = useCallback(
    (axis: "x" | "y", index: number) => (e: React.MouseEvent) => {
      e.preventDefault();
      setDragTarget({ axis, index });
    },
    []
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!dragTarget) return;
      const pt = svgPointFromEvent(e);
      if (!pt) return;

      const newCuts = { x: [...cuts.x] as CutPositions["x"], y: [...cuts.y] as CutPositions["y"] };
      const value = dragTarget.axis === "x" ? pt.x : pt.y;
      const dim = dragTarget.axis === "x" ? viewBox.width : viewBox.height;

      // Clamp between neighbors (or edges)
      const arr = newCuts[dragTarget.axis];
      const min = dragTarget.index === 0 ? viewBox.x : arr[dragTarget.index - 1] + 1;
      const maxEdge = dragTarget.axis === "x" ? viewBox.x + dim : viewBox.y + dim;
      const max = dragTarget.index === 3 ? maxEdge - 1 : arr[dragTarget.index + 1] - 1;

      arr[dragTarget.index] = Math.round(Math.max(min, Math.min(max, value)));
      onCutsChange(newCuts);
    },
    [dragTarget, cuts, svgPointFromEvent, onCutsChange, viewBox]
  );

  const handleMouseUp = useCallback(() => {
    setDragTarget(null);
  }, []);

  const lineColor = "rgba(34, 211, 238, 0.8)"; // cyan-400
  const lineColorHover = "rgba(34, 211, 238, 1)";
  const hitWidth = viewBox.width * 0.01; // 1% of width for easy grabbing

  return (
    <svg
      ref={svgRef}
      viewBox={vbString}
      className="w-full h-full"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Render SVG paths */}
      {svgData.paths.map((d, i) => (
        <path key={i} d={d} fill={svgData.fill} />
      ))}

      {/* Vertical cut lines (x-axis) */}
      {cuts.x.map((cx, i) => (
        <g key={`x-${i}`}>
          {/* Visible line */}
          <line
            x1={cx} y1={viewBox.y} x2={cx} y2={viewBox.y + viewBox.height}
            stroke={hoverTarget?.axis === "x" && hoverTarget.index === i ? lineColorHover : lineColor}
            strokeWidth={viewBox.width * 0.003}
            strokeDasharray={`${viewBox.width * 0.01} ${viewBox.width * 0.005}`}
          />
          {/* Invisible wider hit area */}
          <line
            x1={cx} y1={viewBox.y} x2={cx} y2={viewBox.y + viewBox.height}
            stroke="transparent"
            strokeWidth={hitWidth}
            style={{ cursor: "col-resize" }}
            onMouseDown={handleMouseDown("x", i)}
            onMouseEnter={() => setHoverTarget({ axis: "x", index: i })}
            onMouseLeave={() => setHoverTarget(null)}
          />
          {/* Coordinate tooltip */}
          {(hoverTarget?.axis === "x" && hoverTarget.index === i) || (dragTarget?.axis === "x" && dragTarget.index === i) ? (
            <text
              x={cx + viewBox.width * 0.01}
              y={viewBox.y + viewBox.height * 0.05}
              fill={lineColorHover}
              fontSize={viewBox.width * 0.015}
            >
              x: {Math.round(cx)}
            </text>
          ) : null}
        </g>
      ))}

      {/* Horizontal cut lines (y-axis) */}
      {cuts.y.map((cy, i) => (
        <g key={`y-${i}`}>
          <line
            x1={viewBox.x} y1={cy} x2={viewBox.x + viewBox.width} y2={cy}
            stroke={hoverTarget?.axis === "y" && hoverTarget.index === i ? lineColorHover : lineColor}
            strokeWidth={viewBox.height * 0.003}
            strokeDasharray={`${viewBox.height * 0.01} ${viewBox.height * 0.005}`}
          />
          <line
            x1={viewBox.x} y1={cy} x2={viewBox.x + viewBox.width} y2={cy}
            stroke="transparent"
            strokeWidth={hitWidth}
            style={{ cursor: "row-resize" }}
            onMouseDown={handleMouseDown("y", i)}
            onMouseEnter={() => setHoverTarget({ axis: "y", index: i })}
            onMouseLeave={() => setHoverTarget(null)}
          />
          {(hoverTarget?.axis === "y" && hoverTarget.index === i) || (dragTarget?.axis === "y" && dragTarget.index === i) ? (
            <text
              x={viewBox.x + viewBox.width * 0.01}
              y={cy - viewBox.height * 0.01}
              fill={lineColorHover}
              fontSize={viewBox.height * 0.025}
            >
              y: {Math.round(cy)}
            </text>
          ) : null}
        </g>
      ))}
    </svg>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/cutter/SvgCanvas.tsx
git commit -m "feat: SVG canvas with draggable cut lines and coordinate tooltips"
```

---

### Task 9: Cut Controls (Numeric Inputs)

**Files:**
- Create: `components/cutter/CutControls.tsx`

- [ ] **Step 1: Implement CutControls**

Create `components/cutter/CutControls.tsx`:

```tsx
"use client";

import type { CutPositions, ViewBox } from "@/lib/types";

interface CutControlsProps {
  cuts: CutPositions;
  viewBox: ViewBox;
  onCutsChange: (cuts: CutPositions) => void;
}

const LABELS = ["Cut 1", "Cut 2", "Cut 3", "Cut 4"];
const ZONE_LABELS = ["Corner", "Line", "Ornament", "Line", "Corner"];

export function CutControls({ cuts, viewBox, onCutsChange }: CutControlsProps) {
  const updateCut = (axis: "x" | "y", index: number, value: number) => {
    const newCuts = {
      x: [...cuts.x] as CutPositions["x"],
      y: [...cuts.y] as CutPositions["y"],
    };
    const dim = axis === "x" ? viewBox.width : viewBox.height;
    const origin = axis === "x" ? viewBox.x : viewBox.y;
    const arr = newCuts[axis];

    // Clamp between neighbors
    const min = index === 0 ? origin : arr[index - 1] + 1;
    const max = index === 3 ? origin + dim - 1 : arr[index + 1] - 1;
    arr[index] = Math.round(Math.max(min, Math.min(max, value)));

    onCutsChange(newCuts);
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-xs uppercase tracking-wider text-neutral-500 mb-2">Horizontal Cuts (X)</h3>
        <div className="text-xs text-neutral-600 mb-2 font-mono">
          {ZONE_LABELS.join(" | ")}
        </div>
        <div className="grid grid-cols-4 gap-2">
          {cuts.x.map((val, i) => (
            <div key={`x-${i}`}>
              <label className="text-xs text-neutral-500">{LABELS[i]}</label>
              <input
                type="number"
                value={Math.round(val)}
                min={viewBox.x}
                max={viewBox.x + viewBox.width}
                onChange={(e) => updateCut("x", i, Number(e.target.value))}
                className="w-full bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-sm text-right"
              />
            </div>
          ))}
        </div>
      </div>
      <div>
        <h3 className="text-xs uppercase tracking-wider text-neutral-500 mb-2">Vertical Cuts (Y)</h3>
        <div className="grid grid-cols-4 gap-2">
          {cuts.y.map((val, i) => (
            <div key={`y-${i}`}>
              <label className="text-xs text-neutral-500">{LABELS[i]}</label>
              <input
                type="number"
                value={Math.round(val)}
                min={viewBox.y}
                max={viewBox.y + viewBox.height}
                onChange={(e) => updateCut("y", i, Number(e.target.value))}
                className="w-full bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-sm text-right"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/cutter/CutControls.tsx
git commit -m "feat: numeric cut controls synced with canvas"
```

---

### Task 10: Parts Preview

**Files:**
- Create: `components/cutter/PartsPreview.tsx`

- [ ] **Step 1: Implement PartsPreview**

Create `components/cutter/PartsPreview.tsx`:

```tsx
"use client";

import type { FrameConfig } from "@/lib/types";

interface PartsPreviewProps {
  config: FrameConfig;
  fill: string;
}

const PART_LABELS: { key: keyof FrameConfig["parts"]; label: string }[] = [
  { key: "corner", label: "Corner" },
  { key: "line", label: "Line" },
  { key: "ornament", label: "Ornament" },
];

export function PartsPreview({ config, fill }: PartsPreviewProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-xs uppercase tracking-wider text-neutral-500">Extracted Parts</h3>
      <div className="grid grid-cols-3 gap-3">
        {PART_LABELS.map(({ key, label }) => {
          const part = config.parts[key];
          return (
            <div key={key} className="bg-neutral-900 border border-neutral-800 rounded p-2">
              <p className="text-xs text-neutral-500 mb-1">{label}</p>
              <div className="aspect-square flex items-center justify-center">
                <svg
                  viewBox={part.viewBox}
                  className="w-full h-full"
                  preserveAspectRatio="xMidYMid meet"
                >
                  <path d={part.path} fill={fill} />
                </svg>
              </div>
              <p className="text-[10px] text-neutral-600 mt-1 font-mono truncate">
                {part.viewBox}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/cutter/PartsPreview.tsx
git commit -m "feat: parts preview showing extracted corner, line, ornament"
```

---

### Task 11: Frame Preview with Controls

**Files:**
- Create: `components/frame/FramePreview.tsx`

- [ ] **Step 1: Implement FramePreview**

Create `components/frame/FramePreview.tsx`:

```tsx
"use client";

import { useState } from "react";
import { ResponsiveFrame } from "./ResponsiveFrame";
import { Slider } from "@/components/ui/Slider";
import type { FrameConfig } from "@/lib/types";

interface FramePreviewProps {
  config: FrameConfig;
  fill: string;
}

export function FramePreview({ config, fill }: FramePreviewProps) {
  const [thickness, setThickness] = useState(60);
  const [width, setWidth] = useState(600);
  const [height, setHeight] = useState(400);

  return (
    <div className="space-y-4">
      <h3 className="text-xs uppercase tracking-wider text-neutral-500">Frame Preview</h3>
      <div className="space-y-2">
        <Slider label="Thickness" value={thickness} min={20} max={150} onChange={setThickness} />
        <Slider label="Width" value={width} min={200} max={1200} onChange={setWidth} />
        <Slider label="Height" value={height} min={150} max={800} onChange={setHeight} />
      </div>
      <div className="flex items-center justify-center bg-neutral-950 rounded-lg p-4">
        <ResponsiveFrame
          config={config}
          thickness={thickness}
          fill={fill}
          className="transition-all duration-150"
          style={{ width: `${width}px`, height: `${height}px` }}
        >
          <p className="text-neutral-600 text-sm text-center px-4">
            Content goes here. Resize the frame using the sliders above.
          </p>
        </ResponsiveFrame>
      </div>
    </div>
  );
}
```

Note: This requires adding a `style` prop to `ResponsiveFrame`. Update the interface and the root `div`:

In `components/frame/ResponsiveFrame.tsx`, update:

```tsx
interface ResponsiveFrameProps {
  config: FrameConfig;
  thickness?: number;
  fill?: string;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

export function ResponsiveFrame({
  config,
  thickness = 60,
  fill = "#fff",
  className = "",
  style,
  children,
}: ResponsiveFrameProps) {
  // ... rest stays the same, but merge style:
  return (
    <div
      className={`grid ${className}`}
      style={{
        gridTemplateColumns: `${t} 1fr ${t} 1fr ${t}`,
        gridTemplateRows: `${t} 1fr ${t} 1fr ${t}`,
        ...style,
      }}
    >
```

- [ ] **Step 2: Commit**

```bash
git add components/frame/FramePreview.tsx components/frame/ResponsiveFrame.tsx
git commit -m "feat: frame preview with thickness, width, and height sliders"
```

---

### Task 12: Main Page — Wire Everything Together

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: Implement the main page**

Replace `app/page.tsx` with:

```tsx
"use client";

import { useState, useCallback, useEffect } from "react";
import { parseSvgString } from "@/lib/svgParser";
import { computeDefaultCuts } from "@/lib/svgCutter";
import { buildFrameConfig, serializeConfig } from "@/lib/frameConfig";
import { SvgCanvas } from "@/components/cutter/SvgCanvas";
import { CutControls } from "@/components/cutter/CutControls";
import { PartsPreview } from "@/components/cutter/PartsPreview";
import { FramePreview } from "@/components/frame/FramePreview";
import type { SvgData, CutPositions, FrameConfig } from "@/lib/types";

type Tab = "cutter" | "preview";

export default function Home() {
  const [svgData, setSvgData] = useState<SvgData | null>(null);
  const [cuts, setCuts] = useState<CutPositions | null>(null);
  const [config, setConfig] = useState<FrameConfig | null>(null);
  const [tab, setTab] = useState<Tab>("cutter");
  const [fileName, setFileName] = useState("");

  // Recompute config whenever cuts change
  useEffect(() => {
    if (svgData && cuts) {
      const name = fileName.replace(/\.svg$/i, "") || "Frame";
      setConfig(buildFrameConfig(name, svgData, cuts));
    }
  }, [svgData, cuts, fileName]);

  const handleFileLoad = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const parsed = parseSvgString(text);
    setSvgData(parsed);
    setCuts(computeDefaultCuts(parsed.viewBox));
    setFileName(file.name);
  }, []);

  const handleExport = useCallback(() => {
    if (!config) return;
    const json = serializeConfig(config);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${config.name}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [config]);

  const handleImport = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    try {
      const imported = JSON.parse(text) as FrameConfig;
      setConfig(imported);
      setCuts(imported.cuts);
      setFileName(imported.name);
      // Note: svgData won't be available for the canvas when importing JSON only
      // The user would need to also load the original SVG to edit cuts
    } catch {
      alert("Invalid JSON config");
    }
  }, []);

  return (
    <main className="flex flex-col h-screen">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-2 border-b border-neutral-800">
        <h1 className="text-sm font-mono">frameCutter</h1>
        <div className="flex items-center gap-2">
          {/* Tab switcher */}
          <button
            onClick={() => setTab("cutter")}
            className={`px-3 py-1 text-sm rounded ${tab === "cutter" ? "bg-neutral-700 text-white" : "text-neutral-500 hover:text-neutral-300"}`}
          >
            Cutter
          </button>
          <button
            onClick={() => setTab("preview")}
            className={`px-3 py-1 text-sm rounded ${tab === "preview" ? "bg-neutral-700 text-white" : "text-neutral-500 hover:text-neutral-300"}`}
            disabled={!config}
          >
            Preview
          </button>
          <div className="w-px h-4 bg-neutral-800 mx-1" />
          <label className="px-3 py-1 text-sm text-neutral-400 hover:text-white cursor-pointer">
            Load SVG
            <input type="file" accept=".svg" onChange={handleFileLoad} className="hidden" />
          </label>
          <label className="px-3 py-1 text-sm text-neutral-400 hover:text-white cursor-pointer">
            Import JSON
            <input type="file" accept=".json" onChange={handleImport} className="hidden" />
          </label>
          {config && (
            <button
              onClick={handleExport}
              className="px-3 py-1 text-sm bg-cyan-900 text-cyan-300 rounded hover:bg-cyan-800"
            >
              Export JSON
            </button>
          )}
        </div>
      </header>

      {/* Body */}
      <div className="flex-1 overflow-hidden">
        {!svgData && !config ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-neutral-600">Load an SVG frame to get started</p>
          </div>
        ) : tab === "cutter" && svgData && cuts ? (
          <div className="flex h-full">
            {/* Left: Canvas */}
            <div className="flex-1 p-4 flex items-center justify-center bg-neutral-950">
              <SvgCanvas svgData={svgData} cuts={cuts} onCutsChange={setCuts} />
            </div>
            {/* Right: Controls */}
            <div className="w-80 border-l border-neutral-800 p-4 overflow-y-auto space-y-6">
              <CutControls cuts={cuts} viewBox={svgData.viewBox} onCutsChange={setCuts} />
              {config && <PartsPreview config={config} fill={svgData.fill} />}
            </div>
          </div>
        ) : tab === "preview" && config ? (
          <div className="p-4 overflow-y-auto h-full">
            <FramePreview config={config} fill={svgData?.fill ?? "#fff"} />
          </div>
        ) : null}
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Verify the app compiles**

Run:
```bash
cd /Users/nikita/Documents/Dev/frameCutter && npm run build
```

Expected: Build succeeds with no errors.

- [ ] **Step 3: Manual smoke test**

Run:
```bash
cd /Users/nikita/Documents/Dev/frameCutter && npm run dev
```

Test:
1. Open http://localhost:3000 — see "Load an SVG frame to get started"
2. Click "Load SVG" and select `public/frames/WindowFrame8.svg`
3. Frame appears with 4 cyan dashed cut lines (vertical + horizontal)
4. Drag cut lines — they move, coordinates update in right panel
5. Type new values in numeric fields — cut lines move on canvas
6. Parts Preview shows corner, line, ornament clipped sections
7. Switch to "Preview" tab — frame renders in 5x5 grid
8. Adjust thickness/width/height sliders — frame resizes, corners stay proportional
9. Click "Export JSON" — downloads a `.json` file
10. Reload page, click "Import JSON" — config restores

- [ ] **Step 4: Commit**

```bash
git add app/page.tsx
git commit -m "feat: wire up main page with cutter and preview tabs"
```

---

### Task 13: Run All Tests

- [ ] **Step 1: Run full test suite**

Run:
```bash
cd /Users/nikita/Documents/Dev/frameCutter && npm test
```

Expected: All tests pass (svgParser: 5, svgCutter: 4, frameConfig: 2, responsiveFrame: 8 = 19 total).

- [ ] **Step 2: Final commit if any fixes were needed**

```bash
git add -A
git commit -m "fix: resolve any test issues from integration"
```

Only commit if there were actual changes.
