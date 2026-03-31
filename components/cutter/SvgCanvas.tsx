"use client";

import { useCallback, useRef, useState } from "react";
import type { SvgData, CutPositions, PartDefsMap } from "@/lib/types";
import { getCellRect } from "@/lib/svgCutter";
import { getPartColorById } from "@/components/cutter/PartsPreview";

// SVG-safe colors (can't use Tailwind classes inside SVG)
const SVG_COLORS = [
  { fill: "rgba(251,146,60,0.2)", stroke: "rgba(251,146,60,0.7)" },
  { fill: "rgba(163,230,53,0.2)", stroke: "rgba(163,230,53,0.7)" },
  { fill: "rgba(192,132,252,0.2)", stroke: "rgba(192,132,252,0.7)" },
  { fill: "rgba(34,211,238,0.2)", stroke: "rgba(34,211,238,0.7)" },
  { fill: "rgba(236,72,153,0.2)", stroke: "rgba(236,72,153,0.7)" },
  { fill: "rgba(245,158,11,0.2)", stroke: "rgba(245,158,11,0.7)" },
  { fill: "rgba(52,211,153,0.2)", stroke: "rgba(52,211,153,0.7)" },
  { fill: "rgba(56,189,248,0.2)", stroke: "rgba(56,189,248,0.7)" },
];

function getSvgColor(partId: string, allIds: string[]) {
  const idx = allIds.indexOf(partId);
  return SVG_COLORS[idx % SVG_COLORS.length];
}

interface SvgCanvasProps {
  svgData: SvgData;
  cuts: CutPositions;
  defaultCuts: CutPositions;
  partDefs: PartDefsMap;
  activePartId: string | null;
  onCutsChange: (cuts: CutPositions) => void;
  onZoneClick: (row: number, col: number) => void;
}

type DragTarget = { axis: "x" | "y"; index: number } | null;

export function SvgCanvas({ svgData, cuts, defaultCuts, partDefs, activePartId, onCutsChange, onZoneClick }: SvgCanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dragTarget, setDragTarget] = useState<DragTarget>(null);
  const [hoverTarget, setHoverTarget] = useState<DragTarget>(null);
  const [hoverZone, setHoverZone] = useState<{ row: number; col: number } | null>(null);

  const { viewBox } = svgData;
  const vbString = `${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`;
  const partIds = Object.keys(partDefs);

  // Reverse map: zone key → part ID
  const zonePartMap = new Map<string, string>();
  for (const [id, def] of Object.entries(partDefs)) {
    zonePartMap.set(`${def.row},${def.col}`, id);
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
      const max = dragTarget.index === arr.length - 1 ? maxEdge - 1 : arr[dragTarget.index + 1] - 1;
      arr[dragTarget.index] = Math.round(Math.max(min, Math.min(max, value)));
      onCutsChange(newCuts);
    },
    [dragTarget, cuts, svgPointFromEvent, onCutsChange, viewBox]
  );

  const handleMouseUp = useCallback(() => { setDragTarget(null); }, []);

  const lineColor = "rgba(34, 211, 238, 0.8)";
  const lineColorHover = "rgba(34, 211, 238, 1)";
  const hitWidth = viewBox.width * 0.01;

  return (
    <svg
      ref={svgRef}
      viewBox={vbString}
      preserveAspectRatio="xMidYMid meet"
      style={{ display: "block", maxWidth: "100%", maxHeight: "100%" }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {svgData.paths.map((p, i) => (
        <path key={i} d={p.d} fill={svgData.fill} transform={p.transform} />
      ))}

      {/* Zone overlays */}
      {Array.from({ length: cuts.y.length + 1 }, (_, r) =>
        Array.from({ length: cuts.x.length + 1 }, (_, c) => {
          const rect = getCellRect(viewBox, cuts, r, c);
          if (isNaN(rect.w) || isNaN(rect.h)) return null;
          const key = `${r},${c}`;
          const assignedId = zonePartMap.get(key);
          const isHovered = hoverZone?.row === r && hoverZone?.col === c;

          return (
            <g key={`zone-${key}`}>
              {assignedId && (
                <>
                  <rect
                    x={rect.x} y={rect.y} width={rect.w} height={rect.h}
                    fill={getSvgColor(assignedId, partIds).fill}
                    stroke={getSvgColor(assignedId, partIds).stroke}
                    strokeWidth={viewBox.width * 0.002}
                    pointerEvents="none"
                  />
                  <text
                    x={rect.x + rect.w / 2} y={rect.y + rect.h / 2}
                    fill={getSvgColor(assignedId, partIds).stroke}
                    fontSize={Math.min(rect.w, rect.h) * 0.25}
                    textAnchor="middle" dominantBaseline="central" pointerEvents="none"
                  >
                    {assignedId.slice(0, 4)}
                  </text>
                </>
              )}
              {activePartId && (
                <rect
                  x={rect.x} y={rect.y} width={rect.w} height={rect.h}
                  fill={isHovered ? "rgba(34,211,238,0.15)" : "transparent"}
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

      {/* Cut lines */}
      {cuts.x.map((cx, i) => (
        <g key={`x-${i}`}>
          <line x1={cx} y1={viewBox.y} x2={cx} y2={viewBox.y + viewBox.height}
            stroke={hoverTarget?.axis === "x" && hoverTarget.index === i ? lineColorHover : lineColor}
            strokeWidth={viewBox.width * 0.003}
            strokeDasharray={`${viewBox.width * 0.01} ${viewBox.width * 0.005}`} />
          <line x1={cx} y1={viewBox.y} x2={cx} y2={viewBox.y + viewBox.height}
            stroke="transparent" strokeWidth={hitWidth} style={{ cursor: "col-resize" }}
            onMouseDown={handleMouseDown("x", i)} onDoubleClick={handleDoubleClick("x", i)}
            onMouseEnter={() => setHoverTarget({ axis: "x", index: i })}
            onMouseLeave={() => setHoverTarget(null)} />
          {(hoverTarget?.axis === "x" && hoverTarget.index === i) || (dragTarget?.axis === "x" && dragTarget.index === i) ? (
            <text x={cx + viewBox.width * 0.01} y={viewBox.y + viewBox.height * 0.05}
              fill={lineColorHover} fontSize={viewBox.width * 0.015}>x: {Math.round(cx)}</text>
          ) : null}
        </g>
      ))}
      {cuts.y.map((cy, i) => (
        <g key={`y-${i}`}>
          <line x1={viewBox.x} y1={cy} x2={viewBox.x + viewBox.width} y2={cy}
            stroke={hoverTarget?.axis === "y" && hoverTarget.index === i ? lineColorHover : lineColor}
            strokeWidth={viewBox.height * 0.003}
            strokeDasharray={`${viewBox.height * 0.01} ${viewBox.height * 0.005}`} />
          <line x1={viewBox.x} y1={cy} x2={viewBox.x + viewBox.width} y2={cy}
            stroke="transparent" strokeWidth={hitWidth} style={{ cursor: "row-resize" }}
            onMouseDown={handleMouseDown("y", i)} onDoubleClick={handleDoubleClick("y", i)}
            onMouseEnter={() => setHoverTarget({ axis: "y", index: i })}
            onMouseLeave={() => setHoverTarget(null)} />
          {(hoverTarget?.axis === "y" && hoverTarget.index === i) || (dragTarget?.axis === "y" && dragTarget.index === i) ? (
            <text x={viewBox.x + viewBox.width * 0.01} y={cy - viewBox.height * 0.01}
              fill={lineColorHover} fontSize={viewBox.height * 0.025}>y: {Math.round(cy)}</text>
          ) : null}
        </g>
      ))}
    </svg>
  );
}
