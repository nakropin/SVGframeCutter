"use client";

import type { GridAssignment, PartDefsMap } from "@/lib/types";
import { isBorderCell } from "@/lib/svgCutter";
import { getPartColorById } from "@/components/cutter/PartsPreview";

interface GridAssignerProps {
  grid: GridAssignment;
  partDefs: PartDefsMap;
  activePartId: string | null;
  onCellClick: (row: number, col: number) => void;
}

export function GridAssigner({ grid, partDefs, activePartId, onCellClick }: GridAssignerProps) {
  const partIds = Object.keys(partDefs);

  return (
    <div className="space-y-2">
      <h3 className="text-xs uppercase tracking-wider text-neutral-500">
        Grid Layout
        {activePartId && (
          <span className="text-cyan-400 ml-2">— click a border cell</span>
        )}
      </h3>
      <div className="grid grid-cols-5 gap-1">
        {grid.map((row, r) =>
          row.map((cell, c) => {
            const border = isBorderCell(r, c);
            const color = cell ? getPartColorById(cell, partIds) : null;

            if (!border) {
              return <div key={`${r}-${c}`} className="aspect-square bg-neutral-900/30 rounded-sm" />;
            }

            return (
              <button
                key={`${r}-${c}`}
                onClick={() => onCellClick(r, c)}
                className={`aspect-square rounded-sm border text-[8px] font-bold flex items-center justify-center transition-all ${
                  color
                    ? `${color.bg} ${color.border} ${color.text}`
                    : "bg-neutral-800/50 border-neutral-700/50 text-neutral-600"
                } ${
                  activePartId
                    ? "hover:border-cyan-400 hover:ring-1 hover:ring-cyan-400/30 cursor-pointer"
                    : "cursor-default"
                }`}
              >
                {cell ? cell.slice(0, 3) : ""}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
