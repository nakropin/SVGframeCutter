"use client";

import type { FrameConfig } from "@/lib/types";
import { getCellRect } from "@/lib/svgCutter";

function rectToVB(r: { x: number; y: number; w: number; h: number }): string {
  return `${r.x} ${r.y} ${r.w} ${r.h}`;
}

function getEdgeOrientation(row: number, col: number, rows: number, cols: number): "horizontal" | "vertical" | "corner" {
  const isTopBottom = rows > 1 && (row === 0 || row === rows - 1);
  const isLeftRight = cols > 1 && (col === 0 || col === cols - 1);
  if (isTopBottom && isLeftRight) return "corner";
  if (isTopBottom) return "horizontal";
  return "vertical";
}

function computeCellRendering(
  config: FrameConfig,
  partId: string,
  row: number,
  col: number
): { viewBox: string; cssTransform?: string; svgTransform?: string } {
  const { partDefs, sourceViewBox: vb, cuts, gridCols: cols, gridRows: rows } = config;
  const def = partDefs[partId];
  const cellRect = getCellRect(vb, cuts, row, col);

  // Stretch parts: always use cell's own region, no transforms
  if (def?.stretch) {
    return { viewBox: rectToVB(cellRect) };
  }

  // No definition found: fallback to cell's own region
  if (!def) return { viewBox: rectToVB(cellRect) };

  const canonRect = getCellRect(vb, cuts, def.row, def.col);

  // Mirror: compare which half of the grid (near vs far)
  const halfCol = Math.floor((cols - 1) / 2);
  const halfRow = Math.floor((rows - 1) / 2);
  const mirrorX = (col > halfCol) !== (def.col > halfCol);
  const mirrorY = (row > halfRow) !== (def.row > halfRow);

  let cssMirror = "";
  if (mirrorX && mirrorY) cssMirror = "scale(-1,-1)";
  else if (mirrorX) cssMirror = "scaleX(-1)";
  else if (mirrorY) cssMirror = "scaleY(-1)";

  // Check if rotation is needed (cross-axis placement)
  const canonOrient = getEdgeOrientation(def.row, def.col, rows, cols);
  const cellOrient = getEdgeOrientation(row, col, rows, cols);
  const needsRotation = canonOrient !== cellOrient
    && canonOrient !== "corner" && cellOrient !== "corner";

  if (!needsRotation) {
    return {
      viewBox: rectToVB(canonRect),
      cssTransform: cssMirror || undefined,
    };
  }

  // Cross-axis: SVG-internal rotation
  const cellCX = cellRect.x + cellRect.w / 2;
  const cellCY = cellRect.y + cellRect.h / 2;
  const canonCX = canonRect.x + canonRect.w / 2;
  const canonCY = canonRect.y + canonRect.h / 2;

  const rotDeg = canonOrient === "vertical" ? 90 : -90;

  let svgTransform = `translate(${cellCX}, ${cellCY})`;
  if (mirrorX) svgTransform += ` scale(-1,1)`;
  if (mirrorY) svgTransform += ` scale(1,-1)`;
  svgTransform += ` rotate(${rotDeg})`;
  svgTransform += ` translate(${-canonCX}, ${-canonCY})`;

  const rotatedVB = {
    x: cellCX - canonRect.h / 2,
    y: cellCY - canonRect.w / 2,
    w: canonRect.h,
    h: canonRect.w,
  };

  return {
    viewBox: rectToVB(rotatedVB),
    svgTransform,
  };
}

// Keep for test backward compat
type Position = "top-left" | "top-right" | "bottom-left" | "bottom-right" | "top" | "right" | "bottom" | "left";
export function getTransformForPosition(position: Position): string {
  const transforms: Record<Position, string> = {
    "top-left": "", "top-right": "scaleX(-1)", "bottom-left": "scaleY(-1)", "bottom-right": "scale(-1,-1)",
    top: "", right: "rotate(90)", bottom: "scaleY(-1)", left: "rotate(-90)",
  };
  return transforms[position];
}

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
  const { grid, partDefs, gridCols: cols, gridRows: rows } = config;
  const firstPartId = Object.keys(config.parts)[0];
  const pathData = config.parts[firstPartId]?.path ?? "";
  const pathTransform = config.parts[firstPartId]?.transform;
  const t = `${thickness}px`;

  // Build grid templates: alternating fixed (t) and flexible (1fr)
  const buildTemplate = (size: number) =>
    size === 1 ? "1fr" : Array.from({ length: size }, (_, i) => i % 2 === 0 ? t : "1fr").join(" ");
  const colTemplate = buildTemplate(cols);
  const rowTemplate = buildTemplate(rows);

  // Content area spans inner cells
  const contentCol = cols === 1 ? "1 / 2" : `2 / ${cols}`;
  const contentRow = rows === 1 ? "1 / 2" : `2 / ${rows}`;

  return (
    <div
      className={`grid ${className}`}
      style={{
        gridTemplateColumns: colTemplate,
        gridTemplateRows: rowTemplate,
        ...style,
      }}
    >
      <div
        className="flex items-center justify-center overflow-auto"
        style={{ gridColumn: contentCol, gridRow: contentRow }}
      >
        {children}
      </div>

      {grid.map((row, r) =>
        row.map((cell, c) => {
          if (!cell) return null;

          const { viewBox, cssTransform, svgTransform } = computeCellRendering(config, cell, r, c);
          const stretch = partDefs[cell]?.stretch ?? false;

          return (
            <svg
              key={`${r}-${c}`}
              viewBox={viewBox}
              preserveAspectRatio={stretch ? "none" : "xMidYMid meet"}
              className="w-full h-full block"
              style={{ gridColumn: c + 1, gridRow: r + 1, transform: cssTransform }}
            >
              {svgTransform ? (
                <g transform={svgTransform}><path d={pathData} fill={fill} transform={pathTransform} /></g>
              ) : (
                <path d={pathData} fill={fill} transform={pathTransform} />
              )}
            </svg>
          );
        })
      )}
    </div>
  );
}
