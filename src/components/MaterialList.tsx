import { useState } from 'react';
import { GeneratedBeadPattern, BeadPaletteEntry } from '../types';
import { ClipboardList, Info, ShoppingBag, CheckSquare, Square, Printer } from 'lucide-react';

interface MaterialListProps {
  pattern: GeneratedBeadPattern | null;
  onPrintAll: () => void;
}

export default function MaterialList({ pattern, onPrintAll }: MaterialListProps) {
  const [checkedItems, setCheckedItems] = useState<{ [key: string]: boolean }>({});

  if (!pattern || pattern.palette.length === 0) {
    return (
      <div className="w-full bg-[#fdfdfb] border border-[#e2e2d8] rounded-xl p-5 text-[#2d2d2a] shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <ClipboardList className="w-5 h-5 text-[#5a5a40]" />
          <h2 className="text-sm font-semibold tracking-wider uppercase text-[#5a5a40] font-sans">Bead Inventory & Purchasing</h2>
        </div>
        <div className="bg-[#f5f5f0] border border-[#e2e2d8] rounded-lg p-5 text-center text-[#2d2d2a]/50 text-xs">
          Stitch a pattern using an image to compute raw materials.
        </div>
      </div>
    );
  }

  const { palette, totalBeads } = pattern;

  const toggleCheck = (id: string) => {
    setCheckedItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Standard seed bead weight calculations:
  // Usually, size 11/0 seed beads (2mm) are roughly 80 beads per gram.
  // Standard packets in India are sold in 10g or 50g units, or as 'Tolas' (1 tola ≈ 11.6 grams).
  // Let's offer a friendly physical estimate!
  const getWeightEstimate = (count: number) => {
    const BEADS_PER_GRAM = 80;
    const grams = count / BEADS_PER_GRAM;
    if (grams < 1) return '< 1 gram';
    return `${grams.toFixed(1)}g (approx. ${Math.ceil(grams / 10) * 10}g packet)`;
  };

  return (
    <div className="w-full bg-[#fdfdfb] border border-[#e2e2d8] rounded-xl p-5 text-[#2d2d2a] shadow-sm flex flex-col gap-4">
      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-[#5a5a40]" />
            <h2 className="text-sm font-semibold tracking-wider uppercase text-[#5a5a40] font-sans">
              Bead Material Catalog
            </h2>
          </div>
          
          <button
            onClick={onPrintAll}
            className="flex items-center gap-1 text-[11px] bg-[#5a5a40] hover:bg-[#4a4a30] transition text-white px-2.5 py-1 rounded-md border border-[#e2e2d8]/20 font-bold shadow-sm"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Chart</span>
          </button>
        </div>
        
        <p className="text-xs text-[#2d2d2a]/60 leading-relaxed mb-3">
          Checklist of beads & quantities required to bring this design to life on the Khaat (embroidery frame).
        </p>
      </div>

      {/* Beads Inventory Table */}
      <div className="flex flex-col gap-2 max-h-[380px] overflow-y-auto pr-1">
        {palette.map((bead) => {
          const isChecked = !!checkedItems[bead.colorId];
          return (
            <div
              key={bead.colorId}
              className={`flex items-center justify-between p-3 rounded-lg border transition ${
                isChecked 
                  ? 'bg-emerald-50/20 border-emerald-200' 
                  : 'bg-[#f5f5f0]/40 border-[#e2e2d8]/60 hover:border-[#5a5a40]/40'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                {/* Checkbox */}
                <button
                  type="button"
                  onClick={() => toggleCheck(bead.colorId)}
                  className="text-zinc-400 hover:text-[#5a5a40] transition flex-shrink-0"
                >
                  {isChecked ? (
                    <CheckSquare className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Square className="w-4 h-4" />
                  )}
                </button>

                {/* Color Swatch & Symbol */}
                <div 
                  className="w-7 h-7 rounded-full flex items-center justify-center font-mono font-bold text-xs shadow-sm border border-black/10 flex-shrink-0"
                  style={{ 
                    backgroundColor: bead.hex,
                    color: getTextColor(bead.hex)
                  }}
                >
                  {bead.symbol}
                </div>

                {/* Details */}
                <div className="min-w-0 flex-1">
                  <p className={`font-semibold text-xs truncate ${isChecked ? 'line-through text-zinc-400' : 'text-[#2d2d2a]'}`}>
                    {bead.name}
                  </p>
                  <p className="text-[10px] text-zinc-400 font-mono">
                    HEX: {bead.hex.toUpperCase()}
                  </p>
                </div>
              </div>

              {/* Counts & Weight */}
              <div className="text-right pl-2 flex-shrink-0">
                <p className="font-mono text-xs font-bold text-[#5a5a40]">
                  {bead.count} pcs
                </p>
                <p className="text-[9.5px] text-[#2d2d2a]/50">
                  {getWeightEstimate(bead.count)}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Estimator Summary Info card */}
      <div className="bg-[#f5f5f0] border border-[#e2e2d8] p-3 rounded-lg flex gap-2.5 text-[11px] leading-relaxed text-[#2d2d2a]/80">
        <ShoppingBag className="w-4 h-4 text-[#5a5a40] flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-[#5a5a40]">Purchasing Tip:</p>
          <p className="text-[10px] text-zinc-500 mt-0.5">
            We recommend buying <strong>15% extra beads</strong> ({Math.round(totalBeads * 0.15)} additional beads) to account for scattering, broken elements, and needle knots during Aari stitching.
          </p>
        </div>
      </div>
    </div>
  );
}

// Simple brightness threshold to invert text color over dark/light beads
function getTextColor(hex: string): string {
  const r = parseInt(hex.substring(1, 3), 16);
  const g = parseInt(hex.substring(3, 5), 16);
  const b = parseInt(hex.substring(5, 7), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 150 ? '#000000' : '#ffffff';
}
