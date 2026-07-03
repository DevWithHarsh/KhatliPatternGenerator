import { useState } from 'react';
import ControlPanel from './components/ControlPanel';
import WoodFrameCanvas from './components/WoodFrameCanvas';
import MaterialList from './components/MaterialList';
import KhakaView from './components/KhakaView';
import PrintablePatternChart from './components/PrintablePatternChart';
import { GeneratedBeadPattern, BeadCell } from './types';
import { Sparkles, Printer, Layers, Info } from 'lucide-react';

export default function App() {
  const [pattern, setPattern] = useState<GeneratedBeadPattern | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // Interactive visualization helpers
  const [showSymbols, setShowSymbols] = useState<boolean>(true);
  const [showGridLines, setShowGridLines] = useState<boolean>(true);
  const [fabricColor, setFabricColor] = useState<string>('#FAF9F6'); // Raw Cream Cotton by default
  const [selectedCell, setSelectedCell] = useState<BeadCell | null>(null);
  const [beadLabelType, setBeadLabelType] = useState<'col-sequence' | 'row-sequence' | 'palette'>('col-sequence');

  // Toggle printable overlay
  const [showPrintChart, setShowPrintChart] = useState<boolean>(false);

  return (
    <div className="min-h-screen flex flex-col bg-[#f5f5f0] text-[#2d2d2a] print:bg-white print:text-black">
      
      {/* 1. Header with Natural Tones (Hidden when printing) */}
      <header className="border-b border-[#e2e2d8] bg-[#fdfdfb] py-5 px-6 sm:px-12 flex flex-col md:flex-row md:items-center md:justify-between gap-4 no-print">
        <div>
          <div className="flex items-center gap-3">
            <span className="text-3xl filter drop-shadow">✨</span>
            <h1 className="text-2xl font-serif italic text-[#5a5a40] font-bold tracking-tight">
              Khatli Beadwork Pattern Generator
            </h1>
          </div>
          <p className="text-[10px] text-[#2d2d2a]/60 font-semibold tracking-widest mt-1 uppercase max-w-xl">
            Empowering Artisans &amp; Designers with Interactive Image-to-Beads Stencil Conversions
          </p>
        </div>
        
        {/* Print Shortcut Button */}
        {pattern && (
          <button
            onClick={() => setShowPrintChart(true)}
            className="flex items-center gap-2 bg-[#5a5a40] hover:bg-[#4a4a30] active:bg-[#5a5a40] text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm self-start md:self-auto"
          >
            <Printer className="w-4 h-4" />
            <span>Generate Printable Sheet</span>
          </button>
        )}
      </header>

      {/* 2. Main Studio Grid (Hidden when printing) */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1700px] w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 no-print">
        
        {/* LEFT COLUMN: Controls & Generation Settings (Col: 4) */}
        <div className="col-span-1 lg:col-span-4 flex flex-col gap-6">
          <ControlPanel
            onPatternGenerated={(newPattern) => {
              setPattern(newPattern);
              setSelectedCell(null);
            }}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
          />
        </div>

        {/* CENTER COLUMN: Wooden Embroidery Hoop Visualizer (Col: 5) */}
        <div className="col-span-1 lg:col-span-5 flex flex-col items-center justify-start bg-[#ebebe4] border border-[#e2e2d8] rounded-2xl p-4 sm:p-6 shadow-inner relative min-h-[500px]">
          <div className="absolute inset-0 opacity-10 rounded-2xl pointer-events-none" style={{ backgroundImage: 'radial-gradient(#5a5a40 1.2px, transparent 0)', backgroundSize: '20px 20px' }}></div>
          
          <div className="w-full text-center mb-4 z-10">
            <div className="flex items-center justify-center gap-1.5 text-[10.5px] text-[#5a5a40] font-bold uppercase tracking-widest">
              <Layers className="w-3.5 h-3.5" />
              <span>Fabric Hoop Visualizer</span>
            </div>
            <h2 className="text-lg font-bold font-serif italic text-[#5a5a40] mt-0.5">
              {pattern ? 'Simulated Hand-Stitched Beadwork' : 'Awaiting Design Upload'}
            </h2>
            <p className="text-[10.5px] text-[#2d2d2a]/60 max-w-xs mx-auto mt-0.5">
              {pattern 
                ? 'Your uploaded sketch rendered using 3D glass beads (moti).' 
                : 'Upload an artwork on the left to begin stitching.'}
            </p>
          </div>

          <div className="w-full z-10">
            <WoodFrameCanvas
              pattern={pattern}
              showSymbols={showSymbols}
              setShowSymbols={setShowSymbols}
              showGridLines={showGridLines}
              setShowGridLines={setShowGridLines}
              fabricColor={fabricColor}
              setFabricColor={setFabricColor}
              selectedCell={selectedCell}
              setSelectedCell={setSelectedCell}
              beadLabelType={beadLabelType}
              setBeadLabelType={setBeadLabelType}
            />
          </div>
        </div>

        {/* RIGHT COLUMN: Material Estimator & Training (Col: 3) */}
        <div className="col-span-1 lg:col-span-3 flex flex-col gap-6">
          <MaterialList 
            pattern={pattern} 
            onPrintAll={() => setShowPrintChart(true)}
          />
          <KhakaView 
            onPrintAll={() => setShowPrintChart(true)}
          />
        </div>

      </main>

      {/* 3. Global Print Dialog Overlay Overlay (Modal) */}
      {showPrintChart && (
        <PrintablePatternChart
          pattern={pattern}
          fabricColor={fabricColor}
          beadLabelType={beadLabelType}
          onClose={() => setShowPrintChart(false)}
        />
      )}

      {/* 4. Footer (Hidden when printing) */}
      <footer className="border-t border-[#e2e2d8] py-6 text-center text-[#2d2d2a]/50 text-xs no-print">
        <p>© 2026 Traditional Handloom Beadwork Studio. Designed for authentic Indian craft preservation.</p>
      </footer>

    </div>
  );
}
