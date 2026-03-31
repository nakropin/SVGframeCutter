# Non-Square Grids (CxR)

## Problem
Grid is always NxN (square). User needs grids like 3x1 for buttons (fixed height, variable width).

## Design

### Data Model
Replace `gridSize: number` with `gridCols: number` + `gridRows: number`.
Backward compat: load old data via `gridCols = gridRows = gridSize`.

### Core Logic (`svgCutter.ts`)
- `computeDefaultCuts(viewBox, cols, rows)` — X-cuts = cols-1, Y-cuts = rows-1
- `buildDefaultGrid(cols, rows)` — rows×cols array
- `isBorderCell(row, col, rows, cols)` — only border on axes with >1 cell (3x1 → only left/right borders)
- `getCellRect` — unchanged (already works with cuts directly)

### ResponsiveFrame
- Separate templates: `gridTemplateColumns` from cols, `gridTemplateRows` from rows
- If axis = 1 → template is just `"1fr"` (no border on that axis)
- Content area spans inner cells of both axes
- Mirror logic: `halfCol`/`halfRow` computed independently

### UI
Two rows of buttons replacing single grid selector:
```
Cols: [1] [3] [5] [7]
Rows: [1] [3] [5] [7]
```

### Persistence
- `FrameConfig`: `gridCols` + `gridRows` instead of `gridSize`
- `LibraryEntry`: `gridCols?` + `gridRows?`, fallback to `gridSize`
- Export: writes both `gridCols`/`gridRows` and `gridSize` (max of both, for older consumers)

### Files Changed
- `lib/types.ts` — FrameConfig fields
- `lib/svgCutter.ts` — all grid functions
- `lib/frameConfig.ts` — pass cols/rows
- `lib/library.ts` — LibraryEntry fields
- `app/page.tsx` — state, UI, handlers
- `components/frame/ResponsiveFrame.tsx` — template, rendering
- `components/cutter/GridAssigner.tsx` — grid display
- `components/cutter/SvgCanvas.tsx` — no change (uses cuts directly)
- Tests updated accordingly
