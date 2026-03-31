"use client";

import type { LibraryEntry } from "@/lib/library";

interface LibraryProps {
  entries: LibraryEntry[];
  onSelect: (entry: LibraryEntry) => void;
  onDelete: (id: string) => void;
}

export function Library({ entries, onSelect, onDelete }: LibraryProps) {
  if (entries.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-neutral-600">No frames saved yet. Load an SVG to get started.</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {entries.map((entry) => (
          <div
            key={entry.id}
            className="group bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden hover:border-neutral-600 transition-colors"
          >
            <button
              onClick={() => onSelect(entry)}
              className="w-full p-4 flex items-center justify-center aspect-video bg-neutral-950"
            >
              <svg
                viewBox={extractViewBox(entry.svgString)}
                className="w-full h-full"
                preserveAspectRatio="xMidYMid meet"
                dangerouslySetInnerHTML={{ __html: extractInnerSvg(entry.svgString) }}
              />
            </button>
            <div className="px-3 py-2 flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-sm text-neutral-300 truncate">{entry.name}</p>
                <p className="text-[10px] text-neutral-600">
                  {new Date(entry.updatedAt).toLocaleDateString()}
                  {entry.cuts && <span className="ml-1 text-cyan-700">edited</span>}
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(entry.id);
                }}
                className="text-neutral-700 hover:text-red-400 text-xs px-1 opacity-0 group-hover:opacity-100 transition-opacity"
                title="Delete"
              >
                x
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function extractViewBox(svgString: string): string {
  const match = svgString.match(/viewBox="([^"]+)"/);
  return match?.[1] ?? "0 0 100 100";
}

function extractInnerSvg(svgString: string): string {
  // Strip the outer <svg> tags, keep inner content
  const inner = svgString.replace(/<\?xml[^?]*\?>/g, "")
    .replace(/<svg[^>]*>/, "")
    .replace(/<\/svg>/, "");
  return inner;
}
