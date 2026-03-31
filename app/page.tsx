"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { parseSvgString } from "@/lib/svgParser";
import { computeDefaultCuts, DEFAULT_GRID, DEFAULT_PART_DEFS, isBorderCell } from "@/lib/svgCutter";
import { buildFrameConfig, serializeConfig } from "@/lib/frameConfig";
import { loadLibrary, upsertEntry, deleteEntry, type LibraryEntry } from "@/lib/library";
import { SvgCanvas } from "@/components/cutter/SvgCanvas";
import { CutControls } from "@/components/cutter/CutControls";
import { PartsPreview } from "@/components/cutter/PartsPreview";
import { GridAssigner } from "@/components/cutter/GridAssigner";
import { FramePreview } from "@/components/frame/FramePreview";
import { Library } from "@/components/library/Library";
import type { SvgData, CutPositions, FrameConfig, GridAssignment, PartDefsMap } from "@/lib/types";

type Tab = "library" | "cutter" | "preview";

function cloneGrid(g: GridAssignment | undefined | null): GridAssignment {
  if (!g || !Array.isArray(g) || g.length !== 5) return DEFAULT_GRID.map(row => [...row]);
  return g.map(row => [...row]);
}

export default function Home() {
  const [svgData, setSvgData] = useState<SvgData | null>(null);
  const [svgString, setSvgString] = useState<string>("");
  const [cuts, setCuts] = useState<CutPositions | null>(null);
  const [defaultCuts, setDefaultCuts] = useState<CutPositions | null>(null);
  const [config, setConfig] = useState<FrameConfig | null>(null);
  const [tab, setTab] = useState<Tab>("library");
  const [fileName, setFileName] = useState("");
  const [grid, setGrid] = useState<GridAssignment>(cloneGrid(DEFAULT_GRID));
  const [partDefs, setPartDefs] = useState<PartDefsMap>({ ...DEFAULT_PART_DEFS });
  const [activePartId, setActivePartId] = useState<string | null>(null);
  const [squareCorners, setSquareCorners] = useState(true);
  const [libraryEntries, setLibraryEntries] = useState<LibraryEntry[]>([]);
  const [activeEntryId, setActiveEntryId] = useState<string | null>(null);

  // Load library on mount
  useEffect(() => {
    setLibraryEntries(loadLibrary());
  }, []);

  // Undo/Redo history
  const undoStack = useRef<CutPositions[]>([]);
  const redoStack = useRef<CutPositions[]>([]);
  const isUndoRedo = useRef(false);

  const handleCutsChange = useCallback((newCuts: CutPositions) => {
    if (!isUndoRedo.current && cuts) {
      undoStack.current.push(cuts);
      redoStack.current = [];
    }
    isUndoRedo.current = false;

    // Enforce symmetry + square corners
    if (svgData) {
      const { viewBox } = svgData;
      const mirrorX = (v: number) => viewBox.x + viewBox.width - (v - viewBox.x);
      const mirrorY = (v: number) => viewBox.y + viewBox.height - (v - viewBox.y);

      const symmetric = { x: [...newCuts.x] as CutPositions["x"], y: [...newCuts.y] as CutPositions["y"] };
      const old = cuts;

      if (old) {
        // Symmetric pairs: 0↔3, 1↔2
        for (const axis of ["x", "y"] as const) {
          const mirrorFn = axis === "x" ? mirrorX : mirrorY;
          const cur = symmetric[axis];
          const prev = old[axis];

          if (cur[0] !== prev[0]) {
            symmetric[axis][3] = Math.round(mirrorFn(cur[0]));
          } else if (cur[3] !== prev[3]) {
            symmetric[axis][0] = Math.round(mirrorFn(cur[3]));
          }
          if (cur[1] !== prev[1]) {
            symmetric[axis][2] = Math.round(mirrorFn(cur[1]));
          } else if (cur[2] !== prev[2]) {
            symmetric[axis][1] = Math.round(mirrorFn(cur[2]));
          }
        }

        // Square corners: keep X and Y corner cuts equal
        if (squareCorners) {
          const xChanged0 = symmetric.x[0] !== old.x[0];
          const yChanged0 = symmetric.y[0] !== old.y[0];
          const xChanged3 = newCuts.x[3] !== old.x[3];
          const yChanged3 = newCuts.y[3] !== old.y[3];

          if (xChanged0 || xChanged3) {
            const cornerSize = symmetric.x[0] - viewBox.x;
            symmetric.y[0] = Math.round(viewBox.y + cornerSize);
            symmetric.y[3] = Math.round(mirrorY(viewBox.y + cornerSize));
          } else if (yChanged0 || yChanged3) {
            const cornerSize = symmetric.y[0] - viewBox.y;
            symmetric.x[0] = Math.round(viewBox.x + cornerSize);
            symmetric.x[3] = Math.round(mirrorX(viewBox.x + cornerSize));
          }
        }
      }

      setCuts(symmetric);
    } else {
      setCuts(newCuts);
    }
  }, [cuts, svgData, squareCorners]);

  // Click on SVG canvas zone → define which zone IS this part
  const handleZoneClick = useCallback((row: number, col: number) => {
    if (!activePartId) return;
    setPartDefs(prev => {
      const existing = prev[activePartId];
      return { ...prev, [activePartId]: { ...existing, row, col } };
    });
    setActivePartId(null);
  }, [activePartId]);

  // Click on grid layout cell → assign/unassign a part to a border cell
  const handleGridCellClick = useCallback((row: number, col: number) => {
    if (!activePartId || !isBorderCell(row, col)) return;
    setGrid(prev => {
      const next = cloneGrid(prev);
      next[row][col] = prev[row][col] === activePartId ? null : activePartId;
      return next;
    });
  }, [activePartId]);

  const handlePartAdd = useCallback((name: string, stretch: boolean) => {
    setPartDefs(prev => ({ ...prev, [name]: { row: 0, col: 0, stretch } }));
  }, []);

  const handlePartRemove = useCallback((id: string) => {
    setPartDefs(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    // Remove from grid
    setGrid(prev => prev.map(row => row.map(cell => cell === id ? null : cell)));
    if (activePartId === id) setActivePartId(null);
  }, [activePartId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        const prev = undoStack.current.pop();
        if (prev && cuts) {
          redoStack.current.push(cuts);
          isUndoRedo.current = true;
          setCuts(prev);
        }
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "z" && e.shiftKey) {
        e.preventDefault();
        const next = redoStack.current.pop();
        if (next && cuts) {
          undoStack.current.push(cuts);
          isUndoRedo.current = true;
          setCuts(next);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [cuts]);

  // Recompute config whenever cuts, grid, or partDefs change
  useEffect(() => {
    if (svgData && cuts) {
      const name = fileName.replace(/\.svg$/i, "") || "Frame";
      setConfig(buildFrameConfig(name, svgData, cuts, grid, partDefs));
    }
  }, [svgData, cuts, fileName, grid, partDefs]);

  // Auto-save to library when cuts, grid, or partDefs change (only if entry exists)
  useEffect(() => {
    if (!svgString || !fileName || !activeEntryId) return;
    const entries = upsertEntry(
      { name: fileName.replace(/\.svg$/i, ""), svgString, cuts: cuts ?? undefined, zones: grid, partDefs },
      activeEntryId
    );
    setLibraryEntries(entries);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cuts, grid, partDefs]);

  const openSvg = useCallback((text: string, name: string, entryCuts?: CutPositions, entryGrid?: GridAssignment, entryPartDefs?: PartDefsMap, entryId?: string) => {
    const parsed = parseSvgString(text);
    const initialCuts = entryCuts ?? computeDefaultCuts(parsed.viewBox);
    setSvgData(parsed);
    setSvgString(text);
    setCuts(initialCuts);
    setDefaultCuts(computeDefaultCuts(parsed.viewBox));
    setFileName(name);
    setGrid(entryGrid ? cloneGrid(entryGrid) : cloneGrid(DEFAULT_GRID));
    setPartDefs(entryPartDefs ?? { ...DEFAULT_PART_DEFS });
    setActiveEntryId(entryId ?? null);
    setTab("cutter");
    undoStack.current = [];
    redoStack.current = [];

    if (!entryId) {
      const entries = upsertEntry({ name: name.replace(/\.svg$/i, ""), svgString: text });
      setLibraryEntries(entries);
      setActiveEntryId(entries[0].id);
    }
  }, []);

  const handleFileLoad = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    openSvg(text, file.name);
    e.target.value = "";
  }, [openSvg]);

  const handleLibrarySelect = useCallback((entry: LibraryEntry) => {
    openSvg(entry.svgString, entry.name, entry.cuts, entry.zones as GridAssignment | undefined, entry.partDefs as PartDefsMap | undefined, entry.id);
  }, [openSvg]);

  const handleLibraryDelete = useCallback((id: string) => {
    const entries = deleteEntry(id);
    setLibraryEntries(entries);
    if (activeEntryId === id) {
      setActiveEntryId(null);
      setSvgData(null);
      setSvgString("");
      setCuts(null);
      setConfig(null);
      setTab("library");
    }
  }, [activeEntryId]);

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
      setGrid(imported.grid ?? cloneGrid(DEFAULT_GRID));
      setFileName(imported.name);
    } catch {
      alert("Invalid JSON config");
    }
  }, []);

  return (
    <main className="flex flex-col h-screen">
      <header className="flex items-center justify-between px-4 py-2 border-b border-neutral-800">
        <h1 className="text-sm font-mono">frameCutter</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTab("library")}
            className={`px-3 py-1 text-sm rounded ${tab === "library" ? "bg-neutral-700 text-white" : "text-neutral-500 hover:text-neutral-300"}`}
          >
            Library
          </button>
          <button
            onClick={() => setTab("cutter")}
            className={`px-3 py-1 text-sm rounded ${tab === "cutter" ? "bg-neutral-700 text-white" : "text-neutral-500 hover:text-neutral-300"}`}
            disabled={!svgData}
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

      <div className="flex-1 overflow-hidden">
        {tab === "library" ? (
          <Library entries={libraryEntries} onSelect={handleLibrarySelect} onDelete={handleLibraryDelete} />
        ) : tab === "cutter" && svgData && cuts ? (
          <div className="flex h-full">
            <div className="flex-1 p-4 flex items-center justify-center bg-neutral-950">
              <SvgCanvas svgData={svgData} cuts={cuts} defaultCuts={defaultCuts!} partDefs={partDefs} activePartId={activePartId} onCutsChange={handleCutsChange} onZoneClick={handleZoneClick} />
            </div>
            <div className="w-80 border-l border-neutral-800 p-4 overflow-y-auto space-y-6">
              <CutControls cuts={cuts} viewBox={svgData.viewBox} onCutsChange={handleCutsChange} />
              <label className="flex items-center gap-2 text-sm text-neutral-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={squareCorners}
                  onChange={(e) => setSquareCorners(e.target.checked)}
                  className="accent-cyan-400"
                />
                Square corners
              </label>
              {config && <PartsPreview config={config} partDefs={partDefs} fill={svgData.fill} activePartId={activePartId} onPartSelect={setActivePartId} onPartAdd={handlePartAdd} onPartRemove={handlePartRemove} />}
              <GridAssigner grid={grid} partDefs={partDefs} activePartId={activePartId} onCellClick={handleGridCellClick} />
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
