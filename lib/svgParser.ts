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

  // Compute actual bounding box — paths may extend outside the declared viewBox
  const tempSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  tempSvg.style.cssText = "position:absolute;visibility:hidden;width:0;height:0;overflow:visible";
  for (const d of paths) {
    const p = document.createElementNS("http://www.w3.org/2000/svg", "path");
    p.setAttribute("d", d);
    tempSvg.appendChild(p);
  }
  document.body.appendChild(tempSvg);
  const bbox = tempSvg.getBBox();
  document.body.removeChild(tempSvg);

  // Expand viewBox to encompass all content
  const x0 = Math.min(x, bbox.x);
  const y0 = Math.min(y, bbox.y);
  const x1 = Math.max(x + width, bbox.x + bbox.width);
  const y1 = Math.max(y + height, bbox.y + bbox.height);
  const viewBox = { x: x0, y: y0, width: x1 - x0, height: y1 - y0 };

  // Extract fill from <style> or path attributes
  let fill = "#ffffff";
  const styleEl = doc.querySelector("style");
  if (styleEl?.textContent) {
    const fillMatch = styleEl.textContent.match(/fill:\s*(#[0-9a-fA-F]+)/);
    if (fillMatch) fill = fillMatch[1];
  }

  const contentBox = { x, y, width, height };
  return { viewBox, contentBox, paths, fill };
}
