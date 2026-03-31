# frameCutter

Decompose ornamental SVG frames into responsive, reusable parts. An interactive tool for slicing SVG borders into corners, lines, ornaments (and custom parts), then reassembling them as a scalable CSS Grid component.

## What it does

1. **Cut** — Load an SVG frame, place cut lines to divide it into zones
2. **Assign** — Define which zone is a corner, line, ornament, or custom part
3. **Layout** — Assign parts to border cells in the grid
4. **Preview** — See the responsive frame live, adjust thickness/size
5. **Export** — Download a JSON config for use in your project

## Features

- **Draggable cut lines** with numeric inputs, double-click to reset
- **Dynamic grid sizes** — 3x3, 5x5, 7x7
- **Custom part types** — add beyond the default corner/line/ornament
- **Cross-axis rotation** — place a vertical ornament on a horizontal edge, auto-rotated
- **Symmetric cuts** — mirror pairs stay in sync
- **Square corners** toggle — keep corner zones equal on both axes
- **Undo/Redo** — Ctrl+Z / Ctrl+Shift+Z
- **Library** — SVGs persist in localStorage with all settings
- **Responsive preview** — adjustable width, height, and frame thickness

## The responsive frame component

The `ResponsiveFrame` component renders the frame as a CSS Grid. Fixed-size cells hold corners and ornaments, `1fr` cells hold stretchable lines. Each cell clips its region from the original SVG path — no image files, no extra requests.

```tsx
<ResponsiveFrame
  config={frameConfig}
  thickness={60}
  fill="#fff"
  className="w-full h-[400px]"
>
  <p>Your content here</p>
</ResponsiveFrame>
```

## JSON config format

```json
{
  "name": "WindowFrame8",
  "gridSize": 5,
  "sourceViewBox": { "x": 0, "y": 0, "width": 912, "height": 612 },
  "cuts": { "x": [182, 365, 547, 730], "y": [122, 245, 367, 490] },
  "grid": [
    ["corner", "line", "ornament", "line", "corner"],
    ["line", null, null, null, "line"],
    ["ornament", null, null, null, "ornament"],
    ["line", null, null, null, "line"],
    ["corner", "line", "ornament", "line", "corner"]
  ],
  "partDefs": {
    "corner": { "row": 0, "col": 0, "stretch": false },
    "line": { "row": 0, "col": 1, "stretch": true },
    "ornament": { "row": 2, "col": 0, "stretch": false }
  },
  "parts": {
    "corner": { "viewBox": "0 0 182 122", "path": "M0,0..." },
    "line": { "viewBox": "182 0 183 122", "path": "M0,0..." },
    "ornament": { "viewBox": "0 244 182 123", "path": "M0,0..." }
  }
}
```

## Getting started

```bash
npm install
npm run dev     # http://localhost:3000
npm test        # run tests
npm run build   # production build
```

## Tech stack

- Next.js (App Router)
- TypeScript
- Tailwind CSS v4
- Vitest

## Using the exported frame in your project

1. Export the JSON from frameCutter
2. Copy `components/frame/ResponsiveFrame.tsx` and `lib/svgCutter.ts` (for `getCellRect`) into your project
3. Import the JSON and render:

```tsx
import config from './windowFrame8.json';
import { ResponsiveFrame } from './components/frame/ResponsiveFrame';

export default function Page() {
  return (
    <ResponsiveFrame config={config} thickness={50} fill="#d4af37">
      <h1>Framed content</h1>
    </ResponsiveFrame>
  );
}
```

## Credits

Example SVG frame sourced from [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Art_Nouveau_frame.svg) (public domain).
