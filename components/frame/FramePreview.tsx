"use client";

import { useState } from "react";
import { ResponsiveFrame } from "./ResponsiveFrame";
import { Slider } from "@/components/ui/Slider";
import type { FrameConfig } from "@/lib/types";

interface FramePreviewProps {
  config: FrameConfig;
  fill: string;
}

export function FramePreview({ config, fill }: FramePreviewProps) {
  const [thickness, setThickness] = useState(60);
  const [width, setWidth] = useState(600);
  const [height, setHeight] = useState(400);

  return (
    <div className="space-y-4">
      <h3 className="text-xs uppercase tracking-wider text-neutral-500">Frame Preview</h3>
      <div className="space-y-2">
        <Slider label="Thickness" value={thickness} min={20} max={150} onChange={setThickness} />
        <Slider label="Width" value={width} min={200} max={1200} onChange={setWidth} />
        <Slider label="Height" value={height} min={150} max={800} onChange={setHeight} />
      </div>
      <div className="flex items-center justify-center bg-neutral-950 rounded-lg p-4">
        <ResponsiveFrame
          config={config}
          thickness={thickness}
          fill={fill}
          className="transition-all duration-150"
          style={{ width: `${width}px`, height: `${height}px` }}
        >
          <p className="text-neutral-600 text-sm text-center px-4">
            Content goes here. Resize the frame using the sliders above.
          </p>
        </ResponsiveFrame>
      </div>
    </div>
  );
}
