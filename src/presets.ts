export interface SamplePattern {
  name: string;
  description: string;
  svgDataUri: string;
  defaultRows: number;
  defaultCols: number;
}

// Beautiful simple high-contrast embroidery vector SVGs for demo
export const SAMPLE_PATTERNS: SamplePattern[] = [
  {
    name: "Classic Paisley Motif (Kalka)",
    description: "A traditional teardrop-shaped paisley with internal floral flourishes, highly popular in handloom sarees and wedding dresses.",
    defaultRows: 36,
    defaultCols: 36,
    svgDataUri: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
      <rect width="100" height="100" fill="%23ffffff"/>
      <!-- Paisley Outer Contour -->
      <path d="M 50 90 C 20 90, 15 55, 30 40 C 45 25, 30 10, 60 10 C 85 10, 80 40, 75 60 C 70 80, 80 90, 50 90 Z" fill="%23006a4e" stroke="%23d4af37" stroke-width="2"/>
      <!-- Paisley Center Bud -->
      <path d="M 50 75 C 38 75, 38 55, 48 45 C 55 38, 52 28, 62 35 C 70 42, 65 75, 50 75 Z" fill="%23c41e3a" stroke="%23d4af37" stroke-width="1.5"/>
      <!-- Gold accents -->
      <circle cx="50" cy="60" r="4" fill="%23d4af37"/>
      <circle cx="58" cy="48" r="3.5" fill="%23f5f5f0"/>
      <circle cx="42" cy="50" r="3" fill="%23f5f5f0"/>
    </svg>`
  },
  {
    name: "Royal Peacock Emblem",
    description: "An elegant traditional royal peacock with its feathers fanned, representing beauty and prosperity in Indian handwork.",
    defaultRows: 40,
    defaultCols: 40,
    svgDataUri: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
      <rect width="100" height="100" fill="%23ffffff"/>
      <!-- Crest Feathers -->
      <line x1="45" y1="20" x2="35" y2="12" stroke="%23d4af37" stroke-width="1.5"/>
      <line x1="45" y1="20" x2="45" y2="10" stroke="%23d4af37" stroke-width="1.5"/>
      <line x1="45" y1="20" x2="55" y2="12" stroke="%23d4af37" stroke-width="1.5"/>
      <circle cx="35" cy="12" r="2" fill="%230f52ba"/>
      <circle cx="45" cy="10" r="2" fill="%230f52ba"/>
      <circle cx="55" cy="12" r="2" fill="%230f52ba"/>
      <!-- Peacock Body -->
      <path d="M 45 20 C 35 20, 30 35, 35 50 C 40 65, 60 75, 65 55 C 70 35, 55 20, 45 20 Z" fill="%230f52ba" stroke="%23d4af37" stroke-width="2"/>
      <!-- Wing -->
      <path d="M 42 38 C 48 35, 62 48, 52 62 C 45 68, 38 52, 42 38 Z" fill="%23006a4e" stroke="%23d4af37" stroke-width="1.5"/>
      <!-- Beak -->
      <polygon points="32,32 23,36 31,40" fill="%23d4af37"/>
      <!-- Eye -->
      <circle cx="38" cy="30" r="1.5" fill="%23ffffff"/>
      <circle cx="38" cy="30" r="0.7" fill="%23000000"/>
    </svg>`
  },
  {
    name: "Kutch Lotus Flower Mandala",
    description: "A gorgeous 8-petal symmetric lotus, often seen in the mirror work patterns of western India.",
    defaultRows: 32,
    defaultCols: 32,
    svgDataUri: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
      <rect width="100" height="100" fill="%23ffffff"/>
      <!-- Central core -->
      <circle cx="50" cy="50" r="12" fill="%23d4af37" stroke="%23c41e3a" stroke-width="2"/>
      <circle cx="50" cy="50" r="6" fill="%23ffffff"/>
      <!-- Lotus Petals (8 directions) -->
      <!-- Top -->
      <path d="M 50 38 C 42 30, 42 10, 50 4 C 58 10, 58 30, 50 38 Z" fill="%23c41e3a" stroke="%23d4af37" stroke-width="1.5"/>
      <!-- Bottom -->
      <path d="M 50 62 C 42 70, 42 90, 50 96 C 58 90, 58 70, 50 62 Z" fill="%23c41e3a" stroke="%23d4af37" stroke-width="1.5"/>
      <!-- Left -->
      <path d="M 38 50 C 30 42, 10 42, 4 50 C 10 58, 10 58, 38 50 Z" fill="%23c41e3a" stroke="%23d4af37" stroke-width="1.5"/>
      <!-- Right -->
      <path d="M 62 50 C 70 42, 90 42, 96 50 C 90 58, 90 58, 62 50 Z" fill="%23c41e3a" stroke="%23d4af37" stroke-width="1.5"/>
      <!-- Diagonals -->
      <path d="M 41 41 C 32 32, 20 20, 18 18 C 20 20, 32 32, 41 41 Z" fill="none" stroke="%23006a4e" stroke-width="2"/>
      <circle cx="24" cy="24" r="5" fill="%23006a4e" stroke="%23d4af37" stroke-width="1"/>
      <circle cx="76" cy="24" r="5" fill="%23006a4e" stroke="%23d4af37" stroke-width="1"/>
      <circle cx="24" cy="76" r="5" fill="%23006a4e" stroke="%23d4af37" stroke-width="1"/>
      <circle cx="76" cy="76" r="5" fill="%23006a4e" stroke="%23d4af37" stroke-width="1"/>
    </svg>`
  }
];
