import { BeadCell, BeadPaletteEntry, GeneratedBeadPattern, BeadShape } from '../types';
import { getBeadColorName } from './colorNames';

// RGB distance helper
function getColorDistance(c1: [number, number, number], c2: [number, number, number]): number {
  return Math.sqrt(
    Math.pow(c1[0] - c2[0], 2) +
    Math.pow(c1[1] - c2[1], 2) +
    Math.pow(c1[2] - c2[2], 2)
  );
}

// Convert Hex to RGB
function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16)
      ]
    : [0, 0, 0];
}

// Convert RGB to Hex
function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (val: number) => Math.max(0, Math.min(255, Math.round(val)));
  return '#' + [clamp(r), clamp(g), clamp(b)].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

// Helper to apply image adjustments
function adjustColor(r: number, g: number, b: number, brightness: number, contrast: number, saturation: number): [number, number, number] {
  // 1. Brightness (-100 to 100)
  let red = r + (brightness * 2.55);
  let green = g + (brightness * 2.55);
  let blue = b + (brightness * 2.55);

  // 2. Contrast (-100 to 100)
  const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
  red = factor * (red - 128) + 128;
  green = factor * (green - 128) + 128;
  blue = factor * (blue - 128) + 128;

  // 3. Saturation (-100 to 100)
  const gray = 0.2989 * red + 0.587 * green + 0.1140 * blue;
  const satFactor = (saturation + 100) / 100;
  red = gray + (red - gray) * satFactor;
  green = gray + (green - gray) * satFactor;
  blue = gray + (blue - gray) * satFactor;

  return [
    Math.max(0, Math.min(255, red)),
    Math.max(0, Math.min(255, green)),
    Math.max(0, Math.min(255, blue))
  ];
}

export async function generateBeadsFromImage(
  imageSrc: string,
  rows: number,
  cols: number,
  maxColors: number,
  beadShape: BeadShape,
  brightness: number, // -100 to 100
  contrast: number, // -100 to 100
  saturation: number, // -100 to 100
  symmetry: 'none' | 'horizontal' | 'vertical' | 'dual',
  ignoreWhiteBg: boolean = false // If checked, very bright/white cells are marked as empty (transparent fabric)
): Promise<GeneratedBeadPattern> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      // Create offscreen canvas to resize image
      const canvas = document.createElement('canvas');
      canvas.width = cols;
      canvas.height = rows;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not create canvas context'));
        return;
      }

      // Draw image
      ctx.drawImage(img, 0, 0, cols, rows);
      const imgData = ctx.getImageData(0, 0, cols, rows);
      const pixels = imgData.data;

      // Extract raw RGBs
      const rawGrid: [number, number, number][][] = [];
      for (let r = 0; r < rows; r++) {
        const rowPixels: [number, number, number][] = [];
        for (let c = 0; c < cols; c++) {
          const idx = (r * cols + c) * 4;
          const adjusted = adjustColor(
            pixels[idx],
            pixels[idx + 1],
            pixels[idx + 2],
            brightness,
            contrast,
            saturation
          );
          rowPixels.push(adjusted);
        }
        rawGrid.push(rowPixels);
      }

      // Apply symmetry constraints
      if (symmetry !== 'none') {
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const symCoords: { r: number; c: number }[] = [{ r, c }];

            if (symmetry === 'horizontal' || symmetry === 'dual') {
              symCoords.push({ r, c: cols - 1 - c });
            }
            if (symmetry === 'vertical' || symmetry === 'dual') {
              symCoords.push({ r: rows - 1 - r, c });
            }
            if (symmetry === 'dual') {
              symCoords.push({ r: rows - 1 - r, c: cols - 1 - c });
            }

            // Calculate average RGB of all symmetric coordinates
            let sumR = 0, sumG = 0, sumB = 0;
            symCoords.forEach(coord => {
              const p = rawGrid[coord.r][coord.c];
              sumR += p[0];
              sumG += p[1];
              sumB += p[2];
            });

            const avgR = sumR / symCoords.length;
            const avgG = sumG / symCoords.length;
            const avgB = sumB / symCoords.length;

            // Write average back to all symmetric spots
            symCoords.forEach(coord => {
              rawGrid[coord.r][coord.c] = [avgR, avgG, avgB];
            });
          }
        }
      }

      // Flatten pixels for quantization (excluding empty background if specified)
      const allRgbColors: [number, number, number][] = [];
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const rgb = rawGrid[r][c];
          // If we ignore white backgrounds, check if color is very close to pure white
          if (ignoreWhiteBg) {
            const isVeryBright = rgb[0] > 240 && rgb[1] > 240 && rgb[2] > 240;
            if (isVeryBright) continue;
          }
          allRgbColors.push(rgb);
        }
      }

      // Quantize colors using a custom clustering algorithm
      // Step 1: Count frequency of colors
      const colorCounts: { [key: string]: { rgb: [number, number, number]; count: number } } = {};
      allRgbColors.forEach(rgb => {
        const hex = rgbToHex(rgb[0], rgb[1], rgb[2]);
        if (colorCounts[hex]) {
          colorCounts[hex].count++;
        } else {
          colorCounts[hex] = { rgb, count: 1 };
        }
      });

      const sortedFreq = Object.values(colorCounts).sort((a, b) => b.count - a.count);

      // Step 2: Build palette of up to maxColors
      const paletteRgb: [number, number, number][] = [];
      
      // Use spacing threshold to ensure we pick diverse colors rather than just slight variations of the same color
      const minDistance = 35; // RGB color space distance
      
      for (let i = 0; i < sortedFreq.length && paletteRgb.length < maxColors; i++) {
        const candidate = sortedFreq[i].rgb;
        let isTooClose = false;
        for (const existing of paletteRgb) {
          if (getColorDistance(candidate, existing) < minDistance) {
            isTooClose = true;
            break;
          }
        }
        if (!isTooClose) {
          paletteRgb.push(candidate);
        }
      }

      // If we don't have enough clusters, add the next most frequent colors anyway
      if (paletteRgb.length < maxColors && sortedFreq.length > paletteRgb.length) {
        for (let i = 0; i < sortedFreq.length && paletteRgb.length < maxColors; i++) {
          const candidate = sortedFreq[i].rgb;
          if (!paletteRgb.includes(candidate)) {
            paletteRgb.push(candidate);
          }
        }
      }

      // Step 3: Map palette RGBs to final BeadPaletteEntries
      const paletteEntries: BeadPaletteEntry[] = paletteRgb.map((rgb, idx) => {
        const hex = rgbToHex(rgb[0], rgb[1], rgb[2]);
        const name = getBeadColorName(rgb[0], rgb[1], rgb[2]);
        const symbol = String(idx + 1); // Use numbers starting from 1 instead of alphabets
        return {
          colorId: `c_${idx}`,
          hex,
          symbol,
          name,
          count: 0
        };
      });

      // Step 4: Map each cell in the raw grid to closest palette item
      const grid: BeadCell[][] = [];
      let actualTotalBeads = 0;

      for (let r = 0; r < rows; r++) {
        const rowCells: BeadCell[] = [];
        for (let c = 0; c < cols; c++) {
          const rgb = rawGrid[r][c];
          
          // Check if white bg is ignored
          if (ignoreWhiteBg) {
            const isVeryBright = rgb[0] > 240 && rgb[1] > 240 && rgb[2] > 240;
            if (isVeryBright) {
              rowCells.push({
                row: r,
                col: c,
                color: '#ffffff',
                symbol: '.',
                colorId: 'empty',
                isEmpty: true
              });
              continue;
            }
          }

          // Find closest palette item
          let minDistance = Infinity;
          let closestEntry: BeadPaletteEntry | null = null;

          paletteEntries.forEach(entry => {
            const entryRgb = hexToRgb(entry.hex);
            const dist = getColorDistance(rgb, entryRgb);
            if (dist < minDistance) {
              minDistance = dist;
              closestEntry = entry;
            }
          });

          if (closestEntry) {
            (closestEntry as BeadPaletteEntry).count++;
            actualTotalBeads++;
            rowCells.push({
              row: r,
              col: c,
              color: (closestEntry as BeadPaletteEntry).hex,
              symbol: (closestEntry as BeadPaletteEntry).symbol,
              colorId: (closestEntry as BeadPaletteEntry).colorId
            });
          } else {
            // Fallback
            rowCells.push({
              row: r,
              col: c,
              color: '#ffffff',
              symbol: '.',
              colorId: 'empty',
              isEmpty: true
            });
          }
        }
        grid.push(rowCells);
      }

      // Filter out palette items that have count === 0
      const activePalette = paletteEntries.filter(p => p.count > 0);

      resolve({
        imageSrc,
        rows,
        cols,
        grid,
        palette: activePalette,
        totalBeads: actualTotalBeads,
        beadShape
      });
    };

    img.onerror = () => {
      reject(new Error('Failed to load image source'));
    };

    img.src = imageSrc;
  });
}
