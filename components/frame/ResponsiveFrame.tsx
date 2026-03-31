"use client";

import type { FrameConfig, PartType } from "@/lib/types";

/**
 * Compute the viewBox for a specific cell based on cuts.
 * Each cell clips its own region from the full SVG path.
 */
function getCellViewBox(config: FrameConfig, row: number, col: number): string {
  const { sourceViewBox: vb, cuts } = config;
  const xEdges = [vb.x, cuts.x[0], cuts.x[1], cuts.x[2], cuts.x[3], vb.x + vb.width];
  const yEdges = [vb.y, cuts.y[0], cuts.y[1], cuts.y[2], cuts.y[3], vb.y + vb.height];
  const x = xEdges[col];
  const y = yEdges[row];
  const w = xEdges[col + 1] - xEdges[col];
  const h = yEdges[row + 1] - yEdges[row];
  return `${x} ${y} ${w} ${h}`;
}

/** Lines stretch in one direction */
function isStretchCell(partType: PartType, row: number, col: number): boolean {
  if (partType !== "line") return false;
  return row === 0 || row === 4 || col === 0 || col === 4;
}

interface FramePartProps {
  viewBox: string;
  path: string;
  fill: string;
  preserveAspectRatio?: string;
}

function FramePart({ viewBox, path, fill, preserveAspectRatio = "xMidYMid meet" }: FramePartProps) {
  return (
    <svg
      viewBox={viewBox}
      preserveAspectRatio={preserveAspectRatio}
      className="w-full h-full block"
    >
      <path d={path} fill={fill} />
    </svg>
  );
}

// Keep this export for backward compat with tests
type Position = "top-left" | "top-right" | "bottom-left" | "bottom-right" | "top" | "right" | "bottom" | "left";
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
      {grid.map((row, r) =>
        row.map((cell, c) => {
          // Content area spans inner 3x3
          if (r >= 1 && r <= 3 && c >= 1 && c <= 3) {
            if (r === 1 && c === 1) {
              return (
                <div
                  key={`${r}-${c}`}
                  className="flex items-center justify-center overflow-auto"
                  style={{ gridColumn: "2 / 5", gridRow: "2 / 5" }}
                >
                  {children}
                </div>
              );
            }
            return <div key={`${r}-${c}`} />;
          }

          // Empty border cell
          if (!cell) {
            return <div key={`${r}-${c}`} />;
          }

          // Each cell clips its own region — no transforms needed
          const viewBox = getCellViewBox(config, r, c);
          const stretch = isStretchCell(cell, r, c);

          return (
            <FramePart
              key={`${r}-${c}`}
              viewBox={viewBox}
              path={pathData}
              fill={fill}
              preserveAspectRatio={stretch ? "none" : "xMidYMid meet"}
            />
          );
        })
      )}
    </div>
  );
}
