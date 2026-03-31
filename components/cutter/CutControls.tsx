"use client";

import type { CutPositions, ViewBox } from "@/lib/types";

interface CutControlsProps {
  cuts: CutPositions;
  viewBox: ViewBox;
  onCutsChange: (cuts: CutPositions) => void;
}

export function CutControls({ cuts, viewBox, onCutsChange }: CutControlsProps) {
  const updateCut = (axis: "x" | "y", index: number, value: number) => {
    const newCuts = {
      x: [...cuts.x],
      y: [...cuts.y],
    };
    const dim = axis === "x" ? viewBox.width : viewBox.height;
    const origin = axis === "x" ? viewBox.x : viewBox.y;
    const arr = newCuts[axis];
    const last = arr.length - 1;

    const min = index === 0 ? origin : arr[index - 1] + 1;
    const max = index === last ? origin + dim - 1 : arr[index + 1] - 1;
    arr[index] = Math.round(Math.max(min, Math.min(max, value)));

    onCutsChange(newCuts);
  };

  const numCuts = cuts.x.length;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-xs uppercase tracking-wider text-neutral-500 mb-2">Horizontal Cuts (X)</h3>
        <div className={`grid gap-2`} style={{ gridTemplateColumns: `repeat(${Math.min(numCuts, 4)}, 1fr)` }}>
          {cuts.x.map((val, i) => (
            <div key={`x-${i}`}>
              <label className="text-xs text-neutral-500">Cut {i + 1}</label>
              <input
                type="number"
                value={Math.round(val)}
                min={viewBox.x}
                max={viewBox.x + viewBox.width}
                onChange={(e) => updateCut("x", i, Number(e.target.value))}
                className="w-full bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-sm text-right"
              />
            </div>
          ))}
        </div>
      </div>
      <div>
        <h3 className="text-xs uppercase tracking-wider text-neutral-500 mb-2">Vertical Cuts (Y)</h3>
        <div className={`grid gap-2`} style={{ gridTemplateColumns: `repeat(${Math.min(numCuts, 4)}, 1fr)` }}>
          {cuts.y.map((val, i) => (
            <div key={`y-${i}`}>
              <label className="text-xs text-neutral-500">Cut {i + 1}</label>
              <input
                type="number"
                value={Math.round(val)}
                min={viewBox.y}
                max={viewBox.y + viewBox.height}
                onChange={(e) => updateCut("y", i, Number(e.target.value))}
                className="w-full bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-sm text-right"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
