# frameCutter — Design Spec

## Overview

A Next.js app that lets you decompose ornamental SVG frames into reusable, responsive parts. Two integrated features in one app:

1. **Cutter** — Load an SVG frame, set cut lines (visually + numerically), export parts as JSON
2. **Preview** — Live preview of the responsive frame component with adjustable width, height, and thickness

## Decomposition Model

Each frame side is split into 5 zones:

```
[Corner] [Line] [Ornament] [Line] [Corner]
```

- **Corner** — Complex ornamental piece, fixed aspect ratio, scales uniformly
- **Ornament** — Center decoration on each side, fixed aspect ratio, scales uniformly
- **Line** — Simple connecting element, stretches along one axis to fill remaining space

Only 3 unique parts exist; all 12 positions are derived via CSS rotation/mirroring.

## Architecture

```
frameCutter/
├── app/
│   └── page.tsx              — Main page: Cutter left, Preview right
├── components/
│   ├── cutter/
│   │   ├── SvgCanvas.tsx     — SVG display with draggable cut lines
│   │   ├── CutControls.tsx   — Numeric input fields for cut coordinates
│   │   └── PartsPreview.tsx  — Shows the 3 extracted parts individually
│   ├── frame/
│   │   ├── ResponsiveFrame.tsx  — The responsive component (exportable)
│   │   └── FramePreview.tsx     — Preview with resize/thickness sliders
│   └── ui/
│       └── Slider.tsx
├── lib/
│   ├── svgParser.ts          — Load SVG, extract paths, compute bounding boxes
│   ├── svgCutter.ts          — Apply clipPath-based splitting at cut lines
│   └── frameConfig.ts        — JSON schema, export/import logic
└── public/
    └── frames/               — Example SVGs to load
```

## SVG Cutter — Core Logic

### Cut Lines

4 cut lines per axis (2 vertical, 2 horizontal) divide the SVG into 5 zones per side:

```
        cut1     cut2         cut3     cut4
         |        |            |        |
[Corner] v [Line] v [Ornament] v [Line] v [Corner]
```

### Default Calculation

On load, cuts are placed at equal intervals: SVG width/height divided by 5. User adjusts manually from there.

### Clipping Strategy

Parts are not path-split. Instead, each part gets a `clipPath` with the rectangle defined by its cut boundaries. The original path data stays intact — only the visible area is constrained. Each part's viewBox is set to its clip region.

**Why clipPath over path splitting:**

- Path splitting requires complex Bezier math (splitting curves at arbitrary points)
- clipPath is lossless — original path preserved
- Easy to undo/adjust
- Browser renders clipped paths with equal performance

## Cutter UI

Dark background, minimal design. Two panels side by side:

### Left — SVG Canvas

- Full SVG displayed with 4 colored overlay cut lines (2 vertical, 2 horizontal)
- Cut lines are draggable
- Tooltip shows current coordinate on hover

### Right — Controls + Parts Preview

- **Top:** 4 numeric input fields per axis (cut1–cut4 for X, cut1–cut4 for Y), synced with draggable lines
- **Middle:** The 3 extracted parts (corner, line, ornament) shown individually for visual verification
- **Bottom:** Export button (JSON) + button to switch to frame preview

## Responsive Frame Component

### Grid Layout

5x5 CSS Grid for the full frame:

```css
grid-template-columns: var(--t) 1fr var(--t) 1fr var(--t);
grid-template-rows: var(--t) 1fr var(--t) 1fr var(--t);
```

Where `--t` is the frame thickness (e.g., `60px`).

### Cell Assignment

- 4 corners (fixed cells, uniform scale)
- 4 ornaments at center axes (fixed cells, uniform scale)
- 4 line segments between them (`preserveAspectRatio="none"`, stretch on one axis)
- Center cell is empty — content goes here

### Rotation/Mirroring

All 12 positions derived from 3 unique parts via CSS `transform: rotate()` and `scaleX(-1)` / `scaleY(-1)`. No duplicated path data.

### Thickness Control

Controlled via `--t` CSS variable. Corners and ornaments have `width: 100%; height: 100%` within their grid cell, scaling uniformly as `--t` changes. Line SVGs stretch automatically.

### Component API

```tsx
<ResponsiveFrame
  config={windowFrame8Json}
  thickness={60}
  className="w-full h-[400px]"
>
  {children}
</ResponsiveFrame>
```

## Frame Preview

Shows the `ResponsiveFrame` component live with current cut results.

### Controls

- **Width/Height:** Slider or resize handle on the frame
- **Thickness:** Slider for `--t`
- **Dummy content** inside (e.g., text block) to visualize with real content

Changes in the cutter update the preview immediately.

## JSON Export Format

```json
{
  "name": "WindowFrame8",
  "viewBox": { "width": 912, "height": 612 },
  "cuts": {
    "x": [182.4, 364.8, 547.2, 729.6],
    "y": [122.4, 244.8, 367.2, 489.6]
  },
  "parts": {
    "corner": {
      "viewBox": "0 0 182.4 122.4",
      "path": "M0,0..."
    },
    "ornament": {
      "viewBox": "364.8 0 182.4 122.4",
      "path": "M364.8,0..."
    },
    "line": {
      "viewBox": "182.4 0 182.4 122.4",
      "path": "M182.4,0..."
    }
  }
}
```

- `cuts` stores positions so the cutter can restore state
- `parts` contains clipped paths with their viewBoxes
- Single file = single frame, atomic consistency

## Tech Stack

- **Next.js** (App Router)
- **Tailwind CSS** for styling
- **No component library** — minimal custom UI
- **TypeScript** throughout

## Constraints

- Minimum frame size: sum of fixed parts (corners + ornaments) — below this, parts overlap
- Frame SVGs must have a single or few `<path>` elements (complex multi-element SVGs may need pre-processing)
- The responsive component is designed to be copy-pasteable into other Next.js/Tailwind projects
