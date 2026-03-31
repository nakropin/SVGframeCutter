export interface ViewBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CutPositions {
  x: [number, number, number, number]; // cut1..cut4 along horizontal axis
  y: [number, number, number, number]; // cut1..cut4 along vertical axis
}

export interface Part {
  viewBox: string; // "x y w h" format for SVG viewBox attribute
  path: string;    // SVG path d attribute
}

export interface FrameConfig {
  name: string;
  sourceViewBox: ViewBox;
  cuts: CutPositions;
  parts: {
    corner: Part;
    line: Part;
    ornament: Part;
  };
}

export interface SvgData {
  viewBox: ViewBox;
  paths: string[];   // all <path> d attributes found in the SVG
  fill: string;       // fill color from the SVG (e.g., "#fff")
}
