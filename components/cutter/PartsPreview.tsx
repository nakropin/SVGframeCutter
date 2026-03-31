"use client";

import type { FrameConfig, PartType } from "@/lib/types";

interface PartsPreviewProps {
  config: FrameConfig;
  fill: string;
  activePartType: PartType | null;
  onPartTypeSelect: (type: PartType | null) => void;
}

const PART_LABELS: { key: PartType; label: string }[] = [
  { key: "corner", label: "Corner" },
  { key: "line", label: "Line" },
  { key: "ornament", label: "Ornament" },
];

export function PartsPreview({ config, fill, activePartType, onPartTypeSelect }: PartsPreviewProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-xs uppercase tracking-wider text-neutral-500">Parts</h3>
      <div className="grid grid-cols-3 gap-3">
        {PART_LABELS.map(({ key, label }) => {
          const part = config.parts[key];
          const isActive = activePartType === key;
          return (
            <button
              key={key}
              onClick={() => onPartTypeSelect(isActive ? null : key)}
              className={`bg-neutral-900 border rounded p-2 text-left transition-colors ${
                isActive
                  ? "border-cyan-400 ring-1 ring-cyan-400/50"
                  : "border-neutral-800 hover:border-neutral-600"
              }`}
            >
              <p className={`text-xs mb-1 ${isActive ? "text-cyan-400" : "text-neutral-500"}`}>{label}</p>
              <div className="aspect-square flex items-center justify-center">
                <svg
                  viewBox={part.viewBox}
                  className="w-full h-full"
                  preserveAspectRatio="xMidYMid meet"
                >
                  <path d={part.path} fill={fill} />
                </svg>
              </div>
              <p className="text-[10px] text-neutral-600 mt-1 font-mono truncate">
                {part.viewBox}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
