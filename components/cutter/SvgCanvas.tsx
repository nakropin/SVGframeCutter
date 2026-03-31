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

  const lineColor = "rgba(34, 211, 238, 0.8)";
  const lineColorHover = "rgba(34, 211, 238, 1)";
  const hitWidth = viewBox.width * 0.01;

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
          <line
            x1={cx} y1={viewBox.y} x2={cx} y2={viewBox.y + viewBox.height}
            stroke={hoverTarget?.axis === "x" && hoverTarget.index === i ? lineColorHover : lineColor}
            strokeWidth={viewBox.width * 0.003}
            strokeDasharray={`${viewBox.width * 0.01} ${viewBox.width * 0.005}`}
          />
          <line
            x1={cx} y1={viewBox.y} x2={cx} y2={viewBox.y + viewBox.height}
            stroke="transparent"
            strokeWidth={hitWidth}
            style={{ cursor: "col-resize" }}
            onMouseDown={handleMouseDown("x", i)}
            onMouseEnter={() => setHoverTarget({ axis: "x", index: i })}
            onMouseLeave={() => setHoverTarget(null)}
          />
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
