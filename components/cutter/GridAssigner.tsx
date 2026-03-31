"use client";

import type { GridAssignment, PartType } from "@/lib/types";
import { isBorderCell } from "@/lib/svgCutter";

interface GridAssignerProps {
  grid: GridAssignment;
  activePartType: PartType | null;
  onCellClick: (row: number, col: number) => void;
}

const COLORS: Record<PartType, { bg: string; border: string; text: string }> = {
  corner:   { bg: "bg-orange-900/40", border: "border-orange-500/60", text: "text-orange-400" },
  line:     { bg: "bg-lime-900/40",   border: "border-lime-500/60",   text: "text-lime-400" },
  ornament: { bg: "bg-purple-900/40", border: "border-purple-500/60", text: "text-purple-400" },
};

const LABELS: Record<PartType, string> = {
  corner: "C",
  line: "L",
  ornament: "O",
};

export function GridAssigner({ grid, activePartType, onCellClick }: GridAssignerProps) {
  return (
    <div className="space-y-2">
      <h3 className="text-xs uppercase tracking-wider text-neutral-500">
        Grid Layout
        {activePartType && (
          <span className="text-cyan-400 ml-2">— click a border cell</span>
        )}
      </h3>
      <div className="grid grid-cols-5 gap-1">
        {grid.map((row, r) =>
          row.map((cell, c) => {
            const border = isBorderCell(r, c);
            const color = cell ? COLORS[cell] : null;

            if (!border) {
              // Inner cell — content area
              return (
                <div
                  key={`${r}-${c}`}
                  className="aspect-square bg-neutral-900/30 rounded-sm"
                />
              );
            }

            return (
              <button
                key={`${r}-${c}`}
                onClick={() => onCellClick(r, c)}
                className={`aspect-square rounded-sm border text-[10px] font-bold flex items-center justify-center transition-all ${
                  color
                    ? `${color.bg} ${color.border} ${color.text}`
                    : "bg-neutral-800/50 border-neutral-700/50 text-neutral-600"
                } ${
                  activePartType
                    ? "hover:border-cyan-400 hover:ring-1 hover:ring-cyan-400/30 cursor-pointer"
                    : "cursor-default"
                }`}
              >
                {cell ? LABELS[cell] : ""}
              </button>
            );
          })
        )}
      </div>
      <div className="flex gap-3 text-[10px]">
        {(["corner", "line", "ornament"] as PartType[]).map((type) => (
          <span key={type} className={`${COLORS[type].text}`}>
            {LABELS[type]} = {type}
          </span>
        ))}
      </div>
    </div>
  );
}
