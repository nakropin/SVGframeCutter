"use client";

import type { FrameConfig } from "@/lib/types";

interface PartsPreviewProps {
  config: FrameConfig;
  fill: string;
}

const PART_LABELS: { key: keyof FrameConfig["parts"]; label: string }[] = [
  { key: "corner", label: "Corner" },
  { key: "line", label: "Line" },
  { key: "ornament", label: "Ornament" },
];

export function PartsPreview({ config, fill }: PartsPreviewProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-xs uppercase tracking-wider text-neutral-500">Extracted Parts</h3>
      <div className="grid grid-cols-3 gap-3">
        {PART_LABELS.map(({ key, label }) => {
          const part = config.parts[key];
          return (
            <div key={key} className="bg-neutral-900 border border-neutral-800 rounded p-2">
              <p className="text-xs text-neutral-500 mb-1">{label}</p>
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
            </div>
          );
        })}
      </div>
    </div>
  );
}
