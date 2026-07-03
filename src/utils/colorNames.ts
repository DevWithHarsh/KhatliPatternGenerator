export function getBeadColorName(r: number, g: number, b: number): string {
  // Simple hue-based mapping to name colors beautifully
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  
  // Calculate Hue
  let h = 0;
  if (d !== 0) {
    if (max === r) {
      h = ((g - b) / d) % 6;
    } else if (max === g) {
      h = (b - r) / d + 2;
    } else {
      h = (r - g) / d + 4;
    }
    h = Math.round(h * 60);
    if (h < 0) h += 360;
  }
  
  const s = max === 0 ? 0 : d / max;
  const v = max / 255;
  
  // Low saturation: Grayscale
  if (s < 0.12) {
    if (v > 0.88) return 'Pearl White Moti';
    if (v > 0.5) return 'Silver Metallic Bead';
    if (v > 0.2) return 'Hematite Grey Bead';
    return 'Jet Black Glass Moti';
  }
  
  // High value, moderate saturation around gold/orange hue
  if (h >= 35 && h <= 55 && s >= 0.25) {
    if (v > 0.8) return 'Antique Gold Zari Bead';
    if (v > 0.5) return 'Copper Antique Bead';
    return 'Bronze Metal Bead';
  }
  
  // Hue ranges
  if (h < 15 || h >= 345) {
    if (v > 0.6 && s > 0.6) return 'Royal Ruby Red Moti';
    return 'Garnet Maroon Bead';
  }
  if (h >= 15 && h < 45) {
    if (v > 0.7 && s > 0.6) return 'Saffron Orange Bead';
    return 'Terracotta Coral Moti';
  }
  if (h >= 45 && h < 65) {
    if (v > 0.7 && s > 0.6) return 'Golden Yellow Bead';
    return 'Champagne Glass Moti';
  }
  if (h >= 65 && h < 165) {
    if (v > 0.5 && s > 0.5) return 'Emerald Green Moti';
    if (v > 0.3) return 'Mint Jade Bead';
    return 'Olive Green Glass Bead';
  }
  if (h >= 165 && h < 205) {
    if (v > 0.6) return 'Firoza Turquoise Moti';
    return 'Teal Glass Bead';
  }
  if (h >= 205 && h < 255) {
    if (v > 0.5 && s > 0.5) return 'Kashmiri Sapphire Blue Moti';
    return 'Classic Indigo Glass Bead';
  }
  if (h >= 255 && h < 295) {
    return 'Amethyst Violet Bead';
  }
  if (h >= 295 && h < 345) {
    return 'Magenta Rose Pink Moti';
  }
  
  return 'Traditional Glass Bead';
}
