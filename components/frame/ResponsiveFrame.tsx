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
  const { corner, line, ornament } = config.parts;
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
