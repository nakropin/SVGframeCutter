"use client";

import { useState, useCallback, useEffect } from "react";
import { parseSvgString } from "@/lib/svgParser";
import { computeDefaultCuts } from "@/lib/svgCutter";
import { buildFrameConfig, serializeConfig } from "@/lib/frameConfig";
import { SvgCanvas } from "@/components/cutter/SvgCanvas";
import { CutControls } from "@/components/cutter/CutControls";
import { PartsPreview } from "@/components/cutter/PartsPreview";
import { FramePreview } from "@/components/frame/FramePreview";
import type { SvgData, CutPositions, FrameConfig } from "@/lib/types";

type Tab = "cutter" | "preview";

export default function Home() {
  const [svgData, setSvgData] = useState<SvgData | null>(null);
  const [cuts, setCuts] = useState<CutPositions | null>(null);
  const [config, setConfig] = useState<FrameConfig | null>(null);
  const [tab, setTab] = useState<Tab>("cutter");
  const [fileName, setFileName] = useState("");

  // Recompute config whenever cuts change
  useEffect(() => {
    if (svgData && cuts) {
      const name = fileName.replace(/\.svg$/i, "") || "Frame";
      setConfig(buildFrameConfig(name, svgData, cuts));
    }
  }, [svgData, cuts, fileName]);

  const handleFileLoad = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const parsed = parseSvgString(text);
    setSvgData(parsed);
    setCuts(computeDefaultCuts(parsed.viewBox));
    setFileName(file.name);
  }, []);

  const handleExport = useCallback(() => {
    if (!config) return;
    const json = serializeConfig(config);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${config.name}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [config]);

  const handleImport = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    try {
      const imported = JSON.parse(text) as FrameConfig;
      setConfig(imported);
      setCuts(imported.cuts);
      setFileName(imported.name);
    } catch {
      alert("Invalid JSON config");
    }
  }, []);

  return (
    <main className="flex flex-col h-screen">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-2 border-b border-neutral-800">
        <h1 className="text-sm font-mono">frameCutter</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTab("cutter")}
            className={`px-3 py-1 text-sm rounded ${tab === "cutter" ? "bg-neutral-700 text-white" : "text-neutral-500 hover:text-neutral-300"}`}
          >
            Cutter
          </button>
          <button
            onClick={() => setTab("preview")}
            className={`px-3 py-1 text-sm rounded ${tab === "preview" ? "bg-neutral-700 text-white" : "text-neutral-500 hover:text-neutral-300"}`}
            disabled={!config}
          >
            Preview
          </button>
          <div className="w-px h-4 bg-neutral-800 mx-1" />
          <label className="px-3 py-1 text-sm text-neutral-400 hover:text-white cursor-pointer">
            Load SVG
            <input type="file" accept=".svg" onChange={handleFileLoad} className="hidden" />
          </label>
          <label className="px-3 py-1 text-sm text-neutral-400 hover:text-white cursor-pointer">
            Import JSON
            <input type="file" accept=".json" onChange={handleImport} className="hidden" />
          </label>
          {config && (
            <button
              onClick={handleExport}
              className="px-3 py-1 text-sm bg-cyan-900 text-cyan-300 rounded hover:bg-cyan-800"
            >
              Export JSON
            </button>
          )}
        </div>
      </header>

      {/* Body */}
      <div className="flex-1 overflow-hidden">
        {!svgData && !config ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-neutral-600">Load an SVG frame to get started</p>
          </div>
        ) : tab === "cutter" && svgData && cuts ? (
          <div className="flex h-full">
            <div className="flex-1 p-4 flex items-center justify-center bg-neutral-950">
              <SvgCanvas svgData={svgData} cuts={cuts} onCutsChange={setCuts} />
            </div>
            <div className="w-80 border-l border-neutral-800 p-4 overflow-y-auto space-y-6">
              <CutControls cuts={cuts} viewBox={svgData.viewBox} onCutsChange={setCuts} />
              {config && <PartsPreview config={config} fill={svgData.fill} />}
            </div>
          </div>
        ) : tab === "preview" && config ? (
          <div className="p-4 overflow-y-auto h-full">
            <FramePreview config={config} fill={svgData?.fill ?? "#fff"} />
          </div>
        ) : null}
      </div>
    </main>
  );
}
