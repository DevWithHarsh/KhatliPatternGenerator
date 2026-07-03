import { Scissors, ClipboardList, Eye, Printer, HelpCircle } from 'lucide-react';

interface KhakaViewProps {
  onPrintAll: () => void;
}

export default function KhakaView({ onPrintAll }: KhakaViewProps) {
  return (
    <div className="w-full bg-[#fdfdfb] border border-[#e2e2d8] rounded-xl p-5 text-[#2d2d2a] shadow-sm flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Scissors className="w-5 h-5 text-[#5a5a40]" />
        <h2 className="text-sm font-semibold tracking-wider uppercase text-[#5a5a40] font-sans">
          The Artisan Tracing Process
        </h2>
      </div>

      <p className="text-xs text-[#2d2d2a]/70 leading-relaxed">
        How craftsmen transfer this digital grid blueprint directly onto the physical embroidery frame (Khaat):
      </p>

      {/* Process Steps */}
      <div className="flex flex-col gap-3.5">
        <div className="flex gap-3">
          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#5a5a40]/10 border border-[#5a5a40]/30 text-[#5a5a40] font-bold flex items-center justify-center font-mono text-xs">
            1
          </div>
          <div>
            <h3 className="font-bold text-xs text-[#2d2d2a] mb-0.5">Print the Symbol Grid</h3>
            <p className="text-[#2d2d2a]/60 text-[10.5px] leading-normal">
              Click <strong>"Print Chart"</strong>. This generates a black-and-white grid where each coordinate displays the corresponding bead's symbol code (A, B, C...).
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#5a5a40]/10 border border-[#5a5a40]/30 text-[#5a5a40] font-bold flex items-center justify-center font-mono text-xs">
            2
          </div>
          <div>
            <h3 className="font-bold text-xs text-[#2d2d2a] mb-0.5">Punch Tracing Blueprint (Khaka)</h3>
            <p className="text-[#2d2d2a]/60 text-[10.5px] leading-normal">
              Place a piece of translucent tracing paper over the printed grid. Use a thin sewing pin to punch micro-holes through each active bead center. This becomes your master stencil (Khaka).
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#5a5a40]/10 border border-[#5a5a40]/30 text-[#5a5a40] font-bold flex items-center justify-center font-mono text-xs">
            3
          </div>
          <div>
            <h3 className="font-bold text-xs text-[#2d2d2a] mb-0.5">Rub Chalk Powder (Neel)</h3>
            <p className="text-[#2d2d2a]/60 text-[10.5px] leading-normal">
              Mount your fabric tightly on the wooden loom. Lay the punched tracing paper on top and rub white chalk powder or indigo neel solution across it. This transfers the perfect dots grid.
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#5a5a40]/10 border border-[#5a5a40]/30 text-[#5a5a40] font-bold flex items-center justify-center font-mono text-xs">
            4
          </div>
          <div>
            <h3 className="font-bold text-xs text-[#2d2d2a] mb-0.5">Stitch the Beads (Moti)</h3>
            <p className="text-[#2d2d2a]/60 text-[10.5px] leading-normal">
              Thread your Aari or Tambour needle and follow the chalk markings. Refer to the printed color symbol legend to select the correct bead color for each coordinate.
            </p>
          </div>
        </div>
      </div>

      <button
        onClick={onPrintAll}
        className="w-full py-2.5 rounded-lg text-xs font-semibold bg-[#f5f5f0] hover:bg-[#ebebe4] text-[#2d2d2a] border border-[#e2e2d8] flex items-center justify-center gap-1.5 transition"
      >
        <Printer className="w-4 h-4 text-[#5a5a40]" />
        <span>Open Printable Pattern Chart</span>
      </button>
    </div>
  );
}
