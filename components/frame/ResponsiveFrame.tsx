"use client";

import type { FrameConfig, PartType } from "@/lib/types";
import { getCellRect } from "@/lib/svgCutter";

function rectToVB(r: { x: number; y: number; w: number; h: number }): string {
  return `${r.x} ${r.y} ${r.w} ${r.h}`;
}

function getEdgeOrientation(row: number, col: number): "horizontal" | "vertical" | "corner" {
  const isTopBottom = row === 0 || row === 4;
  const isLeftRight = col === 0 || col === 4;
  if (isTopBottom && isLeftRight) return "corner";
  if (isTopBottom) return "horizontal";
  return "vertical";
}

function computeCellRendering(
  config: FrameConfig,
  partType: PartType,
  row: number,
  col: number
): { viewBox: string; cssTransform?: string; svgTransform?: string } {
  const { partDefs, sourceViewBox: vb, cuts } = config;
  const cellRect = getCellRect(vb, cuts, row, col);

  // Lines: always use cell's own region, no transforms — they just stretch
  if (partType === "line") {
    return { viewBox: rectToVB(cellRect) };
  }

  const canon = partDefs[partType];
  const canonRect = getCellRect(vb, cuts, canon.row, canon.col);

  // Mirror if cell and canonical are on opposite sides
  const mirrorX = (col >= 3) !== (canon.col >= 3);
  const mirrorY = (row >= 3) !== (canon.row >= 3);

  let cssMirror = "";
  if (mirrorX && mirrorY) cssMirror = "scale(-1,-1)";
  else if (mirrorX) cssMirror = "scaleX(-1)";
  else if (mirrorY) cssMirror = "scaleY(-1)";

  // Corners: canonical viewBox + CSS mirror only
  if (partType === "corner") {
    return {
      viewBox: rectToVB(canonRect),
      cssTransform: cssMirror || undefined,
    };
  }

  // Ornaments: check if rotation is needed (cross-axis placement)
  const canonOrient = getEdgeOrientation(canon.row, canon.col);
  const cellOrient = getEdgeOrientation(row, col);
  const needsRotation = canonOrient !== cellOrient
    && canonOrient !== "corner" && cellOrient !== "corner";

  if (!needsRotation) {
    // Same axis: canonical viewBox + CSS mirror
    return {
      viewBox: rectToVB(canonRect),
      cssTransform: cssMirror || undefined,
    };
  }

  // Cross-axis ornament: SVG-internal rotation
  const cellCX = cellRect.x + cellRect.w / 2;
  const cellCY = cellRect.y + cellRect.h / 2;
  const canonCX = canonRect.x + canonRect.w / 2;
  const canonCY = canonRect.y + canonRect.h / 2;

  // Canonical vertical → cell horizontal: rotate 90° CW
  // Canonical horizontal → cell vertical: rotate -90° CCW
  const rotDeg = canonOrient === "vertical" ? 90 : -90;

  let svgTransform = `translate(${cellCX}, ${cellCY})`;
  if (mirrorX) svgTransform += ` scale(-1,1)`;
  if (mirrorY) svgTransform += ` scale(1,-1)`;
  svgTransform += ` rotate(${rotDeg})`;
  svgTransform += ` translate(${-canonCX}, ${-canonCY})`;

  // ViewBox = bounding box of the rotated canonical rect (swapped w/h, centered on cell)
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
      <div
        className="flex items-center justify-center overflow-auto"
        style={{ gridColumn: "2 / 5", gridRow: "2 / 5" }}
      >
        {children}
      </div>

      {grid.map((row, r) =>
        row.map((cell, c) => {
          if (r >= 1 && r <= 3 && c >= 1 && c <= 3) return null;
          if (!cell) return <div key={`${r}-${c}`} style={{ gridColumn: c + 1, gridRow: r + 1 }} />;

          const { viewBox, cssTransform, svgTransform } = computeCellRendering(config, cell, r, c);
          const stretch = cell === "line";

          return (
            <svg
              key={`${r}-${c}`}
              viewBox={viewBox}
              preserveAspectRatio={stretch ? "none" : "xMidYMid meet"}
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
