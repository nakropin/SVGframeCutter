"use client";

import type { FrameConfig, PartType } from "@/lib/types";
import { getCellRect } from "@/lib/svgCutter";

function getEdgeOrientation(row: number, col: number): "horizontal" | "vertical" | "corner" {
  const isTopBottom = row === 0 || row === 4;
  const isLeftRight = col === 0 || col === 4;
  if (isTopBottom && isLeftRight) return "corner";
  if (isTopBottom) return "horizontal";
  return "vertical";
}

/**
 * Compute how to render a part at a given cell position.
 * - Same orientation as canonical → use canonical viewBox + CSS mirror
 * - Different orientation → use cell viewBox + SVG transform (rotate + translate)
 */
function computeCellRendering(config: FrameConfig, partType: PartType, row: number, col: number) {
  const { partDefs, sourceViewBox: vb, cuts } = config;
  const canon = partDefs[partType];

  const canonOrient = getEdgeOrientation(canon.row, canon.col);
  const cellOrient = getEdgeOrientation(row, col);

  // Mirror if cell is on the opposite side from canonical
  const mirrorX = (col >= 3) !== (canon.col >= 3);
  const mirrorY = (row >= 3) !== (canon.row >= 3);

  const needsRotation = canonOrient !== cellOrient
    && canonOrient !== "corner" && cellOrient !== "corner";

  if (!needsRotation) {
    // Same orientation: use canonical viewBox, apply CSS mirror
    const canonRect = getCellRect(vb, cuts, canon.row, canon.col);
    let cssTransform = "";
    if (mirrorX && mirrorY) cssTransform = "scale(-1,-1)";
    else if (mirrorX) cssTransform = "scaleX(-1)";
    else if (mirrorY) cssTransform = "scaleY(-1)";

    return {
      viewBox: `${canonRect.x} ${canonRect.y} ${canonRect.w} ${canonRect.h}`,
      cssTransform: cssTransform || undefined,
      svgTransform: undefined,
    };
  }

  // Different orientation: rotate canonical content into cell region via SVG transform
  const cellRect = getCellRect(vb, cuts, row, col);
  const canonRect = getCellRect(vb, cuts, canon.row, canon.col);

  const cellCX = cellRect.x + cellRect.w / 2;
  const cellCY = cellRect.y + cellRect.h / 2;
  const canonCX = canonRect.x + canonRect.w / 2;
  const canonCY = canonRect.y + canonRect.h / 2;

  // Canonical vertical → cell horizontal: rotate -90° (CCW)
  // Canonical horizontal → cell vertical: rotate 90° (CW)
  const rotDeg = canonOrient === "vertical" ? -90 : 90;

  // Build SVG transform: move canonical center to cell center, with rotation + mirror
  let svgTransform = `translate(${cellCX}, ${cellCY})`;
  if (mirrorX) svgTransform += ` scale(-1,1)`;
  if (mirrorY) svgTransform += ` scale(1,-1)`;
  svgTransform += ` rotate(${rotDeg})`;
  svgTransform += ` translate(${-canonCX}, ${-canonCY})`;

  return {
    viewBox: `${cellRect.x} ${cellRect.y} ${cellRect.w} ${cellRect.h}`,
    cssTransform: undefined,
    svgTransform,
  };
}

function isStretchCell(partType: PartType): boolean {
  return partType === "line";
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
  const { grid } = config;
  const pathData = config.parts.corner.path;
  const t = `${thickness}px`;

  return (
    <div
      className={`grid ${className}`}
      style={{
        gridTemplateColumns: `${t} 1fr ${t} 1fr ${t}`,
        gridTemplateRows: `${t} 1fr ${t} 1fr ${t}`,
        ...style,
      }}
    >
      {/* Content area */}
      <div
        className="flex items-center justify-center overflow-auto"
        style={{ gridColumn: "2 / 5", gridRow: "2 / 5" }}
      >
        {children}
      </div>

      {/* Border cells with explicit positions */}
      {grid.map((row, r) =>
        row.map((cell, c) => {
          if (r >= 1 && r <= 3 && c >= 1 && c <= 3) return null;
          if (!cell) return <div key={`${r}-${c}`} style={{ gridColumn: c + 1, gridRow: r + 1 }} />;

          const { viewBox, cssTransform, svgTransform } = computeCellRendering(config, cell, r, c);

          return (
            <svg
              key={`${r}-${c}`}
              viewBox={viewBox}
              preserveAspectRatio={isStretchCell(cell) ? "none" : "xMidYMid meet"}
              className="w-full h-full block"
              style={{
                gridColumn: c + 1,
                gridRow: r + 1,
                transform: cssTransform,
              }}
            >
              {svgTransform ? (
                <g transform={svgTransform}>
                  <path d={pathData} fill={fill} />
                </g>
              ) : (
                <path d={pathData} fill={fill} />
              )}
            </svg>
          );
        })
      )}
    </div>
  );
}
