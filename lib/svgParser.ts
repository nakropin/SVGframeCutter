import type { SvgData } from "./types";

export function parseSvgString(svgString: string): SvgData {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgString, "image/svg+xml");
  const svgEl = doc.querySelector("svg");

  if (!svgEl) {
    throw new Error("No <svg> element found");
  }

  // Parse viewBox
  const viewBoxAttr = svgEl.getAttribute("viewBox") ?? "0 0 0 0";
  const [x, y, width, height] = viewBoxAttr.split(/\s+/).map(Number);

  // Extract all path d attributes
  const pathEls = doc.querySelectorAll("path");
  const paths: string[] = [];
  for (const p of pathEls) {
    const d = p.getAttribute("d");
    if (d) paths.push(d);
  }

  // Extract fill from <style> or path attributes
  let fill = "#ffffff";
  const styleEl = doc.querySelector("style");
  if (styleEl?.textContent) {
    const fillMatch = styleEl.textContent.match(/fill:\s*(#[0-9a-fA-F]+)/);
    if (fillMatch) fill = fillMatch[1];
  }

  return { viewBox: { x, y, width, height }, paths, fill };
}
