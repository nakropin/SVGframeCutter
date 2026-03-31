"use client";

import { useCallback, useRef, useState } from "react";
import type { SvgData, CutPositions, PartType, PartDefinitions } from "@/lib/types";
import { getCellRect } from "@/lib/svgCutter";

interface SvgCanvasProps {
  svgData: SvgData;
  cuts: CutPositions;
  defaultCuts: CutPositions;
  partDefs: PartDefinitions;
  activePartType: PartType | null;
  onCutsChange: (cuts: CutPositions) => void;
  onZoneClick: (row: number, col: number) => void;
}

type DragTarget = { axis: "x" | "y"; index: number } | null;

const PART_COLORS: Record<PartType, { fill: string; stroke: string }> = {
  corner:   { fill: "rgba(251, 146, 60, 0.2)",  stroke: "rgba(251, 146, 60, 0.7)" },
  line:     { fill: "rgba(163, 230, 53, 0.2)",  stroke: "rgba(163, 230, 53, 0.7)" },
  ornament: { fill: "rgba(192, 132, 252, 0.2)", stroke: "rgba(192, 132, 252, 0.7)" },
};

const PART_LABELS: Record<PartType, string> = {
  corner: "C", line: "L", ornament: "O",
};

export function SvgCanvas({ svgData, cuts, defaultCuts, partDefs, activePartType, onCutsChange, onZoneClick }: SvgCanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dragTarget, setDragTarget] = useState<DragTarget>(null);
  const [hoverTarget, setHoverTarget] = useState<DragTarget>(null);
  const [hoverZone, setHoverZone] = useState<{ row: number; col: number } | null>(null);

  const { viewBox } = svgData;
  const vbString = `${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`;

  // Build reverse map: which zone is which part
  const zonePartMap = new Map<string, PartType>();
  for (const [type, pos] of Object.entries(partDefs) as [PartType, { row: number; col: number }][]) {
    zonePartMap.set(`${pos.row},${pos.col}`, type);
  }

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

  const handleDoubleClick = useCallback(
    (axis: "x" | "y", index: number) => (e: React.MouseEvent) => {
      e.preventDefault();
      const newCuts = { x: [...cuts.x] as CutPositions["x"], y: [...cuts.y] as CutPositions["y"] };
      newCuts[axis][index] = defaultCuts[axis][index];
      onCutsChange(newCuts);
    },
    [cuts, defaultCuts, onCutsChange]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!dragTarget) return;
      const pt = svgPointFromEvent(e);
      if (!pt) return;

      const newCuts = { x: [...cuts.x] as CutPositions["x"], y: [...cuts.y] as CutPositions["y"] };
      const value = dragTarget.axis === "x" ? pt.x : pt.y;
      const dim = dragTarget.axis === "x" ? viewBox.width : viewBox.height;

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
      {/* SVG paths */}
      {svgData.paths.map((d, i) => (
        <path key={i} d={d} fill={svgData.fill} />
      ))}

      {/* 5x5 zone grid: show assigned parts + clickable zones */}
      {Array.from({ length: 5 }, (_, r) =>
        Array.from({ length: 5 }, (_, c) => {
          const rect = getCellRect(viewBox, cuts, r, c);
          const key = `${r},${c}`;
          const assignedType = zonePartMap.get(key);
          const isHovered = hoverZone?.row === r && hoverZone?.col === c;

          return (
            <g key={`zone-${key}`}>
              {/* Colored overlay for zones assigned as part definitions */}
              {assignedType && (
                <>
                  <rect
                    x={rect.x} y={rect.y} width={rect.w} height={rect.h}
                    fill={PART_COLORS[assignedType].fill}
                    stroke={PART_COLORS[assignedType].stroke}
                    strokeWidth={viewBox.width * 0.002}
                    pointerEvents="none"
                  />
                  <text
                    x={rect.x + rect.w / 2}
                    y={rect.y + rect.h / 2}
                    fill={PART_COLORS[assignedType].stroke}
                    fontSize={Math.min(rect.w, rect.h) * 0.3}
                    textAnchor="middle"
                    dominantBaseline="central"
                    pointerEvents="none"
                  >
                    {PART_LABELS[assignedType]}
                  </text>
                </>
              )}

              {/* Clickable hit area when in assignment mode */}
              {activePartType && (
                <rect
                  x={rect.x} y={rect.y} width={rect.w} height={rect.h}
                  fill={isHovered ? "rgba(34, 211, 238, 0.15)" : "transparent"}
                  stroke={isHovered ? lineColorHover : "transparent"}
                  strokeWidth={viewBox.width * 0.003}
                  strokeDasharray={`${viewBox.width * 0.008} ${viewBox.width * 0.004}`}
                  style={{ cursor: "pointer" }}
                  onClick={(e) => { e.stopPropagation(); onZoneClick(r, c); }}
                  onMouseEnter={() => setHoverZone({ row: r, col: c })}
                  onMouseLeave={() => setHoverZone(null)}
                />
              )}
            </g>
          );
        })
      )}

      {/* Vertical cut lines */}
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
            onDoubleClick={handleDoubleClick("x", i)}
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

      {/* Horizontal cut lines */}
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
            onDoubleClick={handleDoubleClick("y", i)}
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
