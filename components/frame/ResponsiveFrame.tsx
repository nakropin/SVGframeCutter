"use client";

import type { FrameConfig, PartType } from "@/lib/types";

function getCellViewBox(config: FrameConfig, row: number, col: number): string {
  const { sourceViewBox: vb, cuts } = config;
  const xEdges = [vb.x, cuts.x[0], cuts.x[1], cuts.x[2], cuts.x[3], vb.x + vb.width];
  const yEdges = [vb.y, cuts.y[0], cuts.y[1], cuts.y[2], cuts.y[3], vb.y + vb.height];
  return `${xEdges[col]} ${yEdges[row]} ${xEdges[col + 1] - xEdges[col]} ${yEdges[row + 1] - yEdges[row]}`;
}

function isStretchCell(partType: PartType): boolean {
  return partType === "line";
}

interface FramePartProps {
  viewBox: string;
  path: string;
  fill: string;
  preserveAspectRatio?: string;
  style?: React.CSSProperties;
}

function FramePart({ viewBox, path, fill, preserveAspectRatio = "xMidYMid meet", style }: FramePartProps) {
  return (
    <svg viewBox={viewBox} preserveAspectRatio={preserveAspectRatio} className="w-full h-full block" style={style}>
      <path d={path} fill={fill} />
    </svg>
  );
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

  // Explicit grid position for every cell — avoids auto-placement bugs
  const cellStyle = (r: number, c: number): React.CSSProperties => ({
    gridColumn: c + 1,
    gridRow: r + 1,
  });

  return (
    <div
      className={`grid ${className}`}
      style={{
        gridTemplateColumns: `${t} 1fr ${t} 1fr ${t}`,
        gridTemplateRows: `${t} 1fr ${t} 1fr ${t}`,
        ...style,
      }}
    >
      {/* Content area spanning inner 3x3 */}
      <div
        className="flex items-center justify-center overflow-auto"
        style={{ gridColumn: "2 / 5", gridRow: "2 / 5" }}
      >
        {children}
      </div>

      {/* Render all 25 cells with explicit positions */}
      {grid.map((row, r) =>
        row.map((cell, c) => {
          // Skip inner cells — content div already covers them
          if (r >= 1 && r <= 3 && c >= 1 && c <= 3) return null;

          // Empty border cell
          if (!cell) {
            return <div key={`${r}-${c}`} style={cellStyle(r, c)} />;
          }

          const viewBox = getCellViewBox(config, r, c);

          return (
            <FramePart
              key={`${r}-${c}`}
              viewBox={viewBox}
              path={pathData}
              fill={fill}
              preserveAspectRatio={isStretchCell(cell) ? "none" : "xMidYMid meet"}
              style={cellStyle(r, c)}
            />
          );
        })
      )}
    </div>
  );
}
