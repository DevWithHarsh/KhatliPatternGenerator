export type BeadShape = 'round' | 'tube';

export interface BeadCell {
  row: number;
  col: number;
  color: string; // Hex color
  symbol: string; // Visual symbol character for the printed pattern (e.g., 'A', '★', '◆')
  colorId: string; // References the palette entry ID
  isEmpty?: boolean; // If cell has no bead (background/transparency)
}

export interface BeadPaletteEntry {
  colorId: string;
  hex: string;
  symbol: string;
  name: string;
  count: number;
}

export interface GeneratedBeadPattern {
  imageSrc: string | null;
  rows: number;
  cols: number;
  grid: BeadCell[][];
  palette: BeadPaletteEntry[];
  totalBeads: number;
  beadShape: BeadShape;
}
