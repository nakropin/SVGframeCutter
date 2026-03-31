"use client";

import { useState } from "react";
import type { FrameConfig, PartDefsMap } from "@/lib/types";

// Rotating color palette for parts
const PALETTE = [
  { bg: "bg-orange-900/40", border: "border-orange-500/60", text: "text-orange-400", label: "text-orange-400" },
  { bg: "bg-lime-900/40", border: "border-lime-500/60", text: "text-lime-400", label: "text-lime-400" },
  { bg: "bg-purple-900/40", border: "border-purple-500/60", text: "text-purple-400", label: "text-purple-400" },
  { bg: "bg-cyan-900/40", border: "border-cyan-500/60", text: "text-cyan-400", label: "text-cyan-400" },
  { bg: "bg-pink-900/40", border: "border-pink-500/60", text: "text-pink-400", label: "text-pink-400" },
  { bg: "bg-amber-900/40", border: "border-amber-500/60", text: "text-amber-400", label: "text-amber-400" },
  { bg: "bg-emerald-900/40", border: "border-emerald-500/60", text: "text-emerald-400", label: "text-emerald-400" },
  { bg: "bg-sky-900/40", border: "border-sky-500/60", text: "text-sky-400", label: "text-sky-400" },
];

export function getPartColor(index: number) {
  return PALETTE[index % PALETTE.length];
}

export function getPartColorById(partId: string, allIds: string[]) {
  return getPartColor(allIds.indexOf(partId));
}

interface PartsPreviewProps {
  config: FrameConfig;
  partDefs: PartDefsMap;
  fill: string;
  activePartId: string | null;
  onPartSelect: (id: string | null) => void;
  onPartAdd: (name: string, stretch: boolean) => void;
  onPartRemove: (id: string) => void;
}

export function PartsPreview({ config, partDefs, fill, activePartId, onPartSelect, onPartAdd, onPartRemove }: PartsPreviewProps) {
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newStretch, setNewStretch] = useState(false);
  const partIds = Object.keys(partDefs);

  const handleAdd = () => {
    const trimmed = newName.trim().toLowerCase().replace(/\s+/g, "-");
    if (!trimmed || partDefs[trimmed]) return;
    onPartAdd(trimmed, newStretch);
    setNewName("");
    setNewStretch(false);
    setAdding(false);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs uppercase tracking-wider text-neutral-500">Parts</h3>
        <button
          onClick={() => setAdding(!adding)}
          className="text-xs text-neutral-500 hover:text-cyan-400 transition-colors"
        >
          {adding ? "Cancel" : "+ Add"}
        </button>
      </div>

      {adding && (
        <div className="flex flex-col gap-2 p-2 bg-neutral-900 border border-neutral-800 rounded">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            placeholder="Part name"
            className="bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-sm"
            autoFocus
          />
          <label className="flex items-center gap-2 text-xs text-neutral-400">
            <input type="checkbox" checked={newStretch} onChange={(e) => setNewStretch(e.target.checked)} className="accent-cyan-400" />
            Stretch (line-like)
          </label>
          <button onClick={handleAdd} className="text-xs bg-cyan-900 text-cyan-300 rounded px-2 py-1 hover:bg-cyan-800">
            Create
          </button>
        </div>
      )}

      <div className="grid grid-cols-3 gap-2">
        {partIds.map((id, idx) => {
          const part = config.parts[id];
          const def = partDefs[id];
          const isActive = activePartId === id;
          const color = getPartColor(idx);

          return (
            <div key={id} className="relative group">
              <button
                onClick={() => onPartSelect(isActive ? null : id)}
                className={`w-full rounded p-2 text-left transition-colors border ${
                  isActive
                    ? "border-cyan-400 ring-1 ring-cyan-400/50 bg-neutral-900"
                    : "border-neutral-800 bg-neutral-900 hover:border-neutral-600"
                }`}
              >
                <div className="flex items-center gap-1 mb-1">
                  <span className={`text-xs font-medium ${color.label}`}>{id}</span>
                  {def?.stretch && <span className="text-[9px] text-neutral-600">↔</span>}
                </div>
                {part && (
                  <div className="aspect-square flex items-center justify-center">
                    <svg viewBox={part.viewBox} className="w-full h-full" preserveAspectRatio="xMidYMid meet">
                      <path d={part.path} fill={fill} />
                    </svg>
                  </div>
                )}
              </button>
              {!["corner", "line", "ornament"].includes(id) && (
                <button
                  onClick={() => onPartRemove(id)}
                  className="absolute -top-1 -right-1 w-4 h-4 bg-neutral-800 border border-neutral-700 rounded-full text-[9px] text-neutral-500 hover:text-red-400 hover:border-red-400 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                >
                  x
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
