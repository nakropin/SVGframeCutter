import type { CutPositions, GridAssignment, PartDefsMap } from "./types";

export interface LibraryEntry {
  id: string;
  name: string;
  svgString: string;
  cuts?: CutPositions;
  zones?: GridAssignment;
  partDefs?: PartDefsMap;
  gridSize?: number;
  updatedAt: number;
}

const STORAGE_KEY = "framecutter-library";

export function loadLibrary(): LibraryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const entries = JSON.parse(raw) as LibraryEntry[];
    // Deduplicate by name — keep the most recently updated
    const seen = new Map<string, LibraryEntry>();
    for (const e of entries) {
      const existing = seen.get(e.name);
      if (!existing || e.updatedAt > existing.updatedAt) {
        seen.set(e.name, e);
      }
    }
    const deduped = [...seen.values()].sort((a, b) => b.updatedAt - a.updatedAt);
    if (deduped.length < entries.length) {
      saveLibrary(deduped);
    }
    return deduped;
  } catch {
    return [];
  }
}

export function saveLibrary(entries: LibraryEntry[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export function upsertEntry(entry: Omit<LibraryEntry, "id" | "updatedAt">, existingId?: string): LibraryEntry[] {
  const entries = loadLibrary();
  const id = existingId ?? crypto.randomUUID();
  const now = Date.now();

  const idx = entries.findIndex((e) => e.id === id);
  const full: LibraryEntry = { ...entry, id, updatedAt: now };

  if (idx >= 0) {
    entries[idx] = full;
  } else {
    entries.unshift(full);
  }

  saveLibrary(entries);
  return entries;
}

export function deleteEntry(id: string): LibraryEntry[] {
  const entries = loadLibrary().filter((e) => e.id !== id);
  saveLibrary(entries);
  return entries;
}
