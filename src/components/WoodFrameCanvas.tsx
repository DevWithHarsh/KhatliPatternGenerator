import { useState, useEffect, useMemo } from 'react';
import { GeneratedBeadPattern, BeadCell } from '../types';
import { Search, RotateCcw, ZoomIn, ZoomOut, Eye, Info, ChevronLeft, ChevronRight, Hash, ArrowRight, ArrowDown } from 'lucide-react';

interface WoodFrameCanvasProps {
  pattern: GeneratedBeadPattern | null;
  showSymbols: boolean;
  setShowSymbols: (show: boolean) => void;
  showGridLines: boolean;
  setShowGridLines: (show: boolean) => void;
  fabricColor: string;
  setFabricColor: (color: string) => void;
  selectedCell: BeadCell | null;
  setSelectedCell: (cell: BeadCell | null) => void;
  beadLabelType: 'col-sequence' | 'row-sequence' | 'palette';
  setBeadLabelType: (type: 'col-sequence' | 'row-sequence' | 'palette') => void;
}

export const FABRIC_BACKGROUNDS = [
  { name: 'Raw Cream Cotton', hex: '#FAF9F6', text: 'text-[#2d2d2a]/80' },
  { name: 'Bridal Crimson Silk', hex: '#5c0612', text: 'text-white' },
  { name: 'Royal Emerald Velvet', hex: '#0a361a', text: 'text-white' },
  { name: 'Midnight Indigo Silk', hex: '#0f172a', text: 'text-white' },
  { name: 'Saffron Khadi', hex: '#c2410c', text: 'text-white' },
  { name: 'Charcoal Linen', hex: '#1e293b', text: 'text-white' }
];

export default function WoodFrameCanvas({
  pattern,
  showSymbols,
  setShowSymbols,
  showGridLines,
  setShowGridLines,
  fabricColor,
  setFabricColor,
  selectedCell,
  setSelectedCell,
  beadLabelType,
  setBeadLabelType
}: WoodFrameCanvasProps) {
  const [cellSize, setCellSize] = useState<number>(14); // in pixels
  const [hoveredCell, setHoveredCell] = useState<BeadCell | null>(null);

  const [inspectMode, setInspectMode] = useState<'row' | 'column'>('row');
  const [inspectIndex, setInspectIndex] = useState<number>(0);

  // Sync inspect index if user clicks a cell in the grid
  useEffect(() => {
    if (selectedCell) {
      if (inspectMode === 'row') {
        setInspectIndex(selectedCell.row);
      } else {
        setInspectIndex(selectedCell.col);
      }
    }
  }, [selectedCell, inspectMode]);

  const rows = pattern?.rows || 0;
  const cols = pattern?.cols || 0;
  const grid = pattern?.grid || [];

  // Pre-calculate sequential bead numbers row-wise and column-wise for high-performance rendering
  const sequenceGrid = useMemo(() => {
    if (!pattern) {
      return { colSequences: [], rowSequences: [] };
    }
    // colSequences[r][c] will store the column sequence number of the bead at (r, c)
    const colSequences: number[][] = Array.from({ length: rows }, () => Array(cols).fill(0));
    // rowSequences[r][c] will store the row sequence number of the bead at (r, c)
    const rowSequences: number[][] = Array.from({ length: rows }, () => Array(cols).fill(0));
    
    // Calculate column sequences: for each column, track running count of each color
    for (let c = 0; c < cols; c++) {
      const colorCounts: { [color: string]: number } = {};
      for (let r = 0; r < rows; r++) {
        const cell = grid[r]?.[c];
        if (cell && !cell.isEmpty) {
          if (!colorCounts[cell.color]) {
            colorCounts[cell.color] = 0;
          }
          colorCounts[cell.color]++;
          colSequences[r][c] = colorCounts[cell.color];
        }
      }
    }
    
    // Calculate row sequences: for each row, track running count of each color
    for (let r = 0; r < rows; r++) {
      const colorCounts: { [color: string]: number } = {};
      const rowCells = grid[r] || [];
      for (let c = 0; c < cols; c++) {
        const cell = rowCells[c];
        if (cell && !cell.isEmpty) {
          if (!colorCounts[cell.color]) {
            colorCounts[cell.color] = 0;
          }
          colorCounts[cell.color]++;
          rowSequences[r][c] = colorCounts[cell.color];
        }
      }
    }
    
    return { colSequences, rowSequences };
  }, [grid, rows, cols, pattern]);

  if (!pattern) {
    return (
      <div className="w-full aspect-[4/3] max-w-2xl bg-[#ebebe4] border-2 border-dashed border-[#e2e2d8] rounded-2xl flex flex-col items-center justify-center p-8 text-center text-[#2d2d2a]/60">
        <div className="w-16 h-16 rounded-full bg-white/50 flex items-center justify-center mb-4 text-3xl shadow-sm">
          🖼️
        </div>
        <h3 className="text-base font-bold font-serif italic text-[#5a5a40]">No Design Loaded Yet</h3>
        <p className="text-xs max-w-xs mt-1.5 leading-relaxed">
          Upload an image, adjust your rows and columns, or click a quick-load sample motif on the left to stitch your first pattern.
        </p>
      </div>
    );
  }

  const { beadShape } = pattern;

  // Helper to get active display symbol for a bead cell
  const getBeadDisplaySymbol = (cell: BeadCell) => {
    if (beadLabelType === 'palette') {
      return cell.symbol; // Default index-based symbol e.g., "1", "2", "3"
    }
    if (beadLabelType === 'col-sequence') {
      const num = sequenceGrid.colSequences[cell.row]?.[cell.col] || 0;
      return num > 0 ? String(num) : '';
    }
    if (beadLabelType === 'row-sequence') {
      const num = sequenceGrid.rowSequences[cell.row]?.[cell.col] || 0;
      return num > 0 ? String(num) : '';
    }
    return cell.symbol;
  };

  // Find cell under select
  const handleCellClick = (cell: BeadCell) => {
    if (cell.isEmpty) return;
    setSelectedCell(selectedCell?.row === cell.row && selectedCell?.col === cell.col ? null : cell);
  };

  const getBeadStyle = (hex: string, isEmpty?: boolean) => {
    if (isEmpty) return {};
    return {
      backgroundColor: hex,
      boxShadow: 'inset -2px -2px 4px rgba(0,0,0,0.4), inset 1px 1px 2px rgba(255,255,255,0.6), 0px 1.5px 2px rgba(0,0,0,0.2)'
    };
  };

  // Get color-wise bead count for the selected row/column
  const getInspectBeadCounts = () => {
    const counts: { [hex: string]: { count: number; symbol: string; name: string } } = {};
    let totalCount = 0;
    
    if (inspectMode === 'row') {
      const rowCells = grid[inspectIndex] || [];
      rowCells.forEach(cell => {
        if (!cell.isEmpty) {
          totalCount++;
          if (!counts[cell.color]) {
            const paletteItem = pattern.palette.find(p => p.hex === cell.color);
            counts[cell.color] = {
              count: 0,
              symbol: cell.symbol,
              name: paletteItem ? paletteItem.name : 'Bead'
            };
          }
          counts[cell.color].count++;
        }
      });
    } else {
      for (let r = 0; r < rows; r++) {
        const cell = grid[r]?.[inspectIndex];
        if (cell && !cell.isEmpty) {
          totalCount++;
          if (!counts[cell.color]) {
            const paletteItem = pattern.palette.find(p => p.hex === cell.color);
            counts[cell.color] = {
              count: 0,
              symbol: cell.symbol,
              name: paletteItem ? paletteItem.name : 'Bead'
            };
          }
          counts[cell.color].count++;
        }
      }
    }
    
    const colorsList = Object.entries(counts).map(([color, data]) => ({
      color,
      ...data
    }));

    return { colorsList, totalCount };
  };

  const { colorsList: inspectedColors, totalCount: inspectedTotal } = getInspectBeadCounts();

  return (
    <div className="w-full flex flex-col items-center gap-4">
      {/* Mini Controls Strip */}
      <div className="w-full flex flex-wrap items-center justify-between gap-3 bg-[#fdfdfb] border border-[#e2e2d8] p-3 rounded-xl shadow-sm text-xs text-[#2d2d2a]/80">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-[11px] uppercase tracking-wide text-[#5a5a40]">Visual Assist:</span>
          <label className="flex items-center gap-1.5 cursor-pointer hover:text-[#5a5a40] font-semibold">
            <input
              type="checkbox"
              checked={showSymbols}
              onChange={(e) => setShowSymbols(e.target.checked)}
              className="accent-[#5a5a40] rounded"
            />
            <span>Show Symbols</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer hover:text-[#5a5a40] font-semibold">
            <input
              type="checkbox"
              checked={showGridLines}
              onChange={(e) => setShowGridLines(e.target.checked)}
              className="accent-[#5a5a40] rounded"
            />
            <span>Show Grid Lines</span>
          </label>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-[#2d2d2a]/40 uppercase">Bead Size</span>
          <button
            onClick={() => setCellSize(Math.max(8, cellSize - 2))}
            className="p-1 rounded bg-[#f5f5f0] hover:bg-[#ebebe4] transition text-[#5a5a40]"
            title="Smaller Beads"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="font-mono text-[11px] font-bold w-10 text-center">{cellSize}px</span>
          <button
            onClick={() => setCellSize(Math.min(32, cellSize + 2))}
            className="p-1 rounded bg-[#f5f5f0] hover:bg-[#ebebe4] transition text-[#5a5a40]"
            title="Larger Beads"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
        </div>

        {/* Fabric Picker */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-[#2d2d2a]/40 uppercase">Fabric Backdrop:</span>
          <div className="flex gap-1">
            {FABRIC_BACKGROUNDS.map((bg) => (
              <button
                key={bg.hex}
                onClick={() => setFabricColor(bg.hex)}
                className={`w-5 h-5 rounded-full border transition ${
                  fabricColor === bg.hex ? 'ring-2 ring-[#5a5a40]/60 scale-110' : 'border-[#e2e2d8] hover:scale-105'
                }`}
                style={{ backgroundColor: bg.hex }}
                title={bg.name}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Bead Numbering Mode Selector Strip */}
      <div className="w-full flex flex-wrap items-center justify-between gap-3 bg-[#fdfdfb] border border-[#e2e2d8] p-3 rounded-xl shadow-sm text-xs">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-[#5a5a40] uppercase tracking-wide">Bead Counting Style:</span>
          <span className="text-[10px] text-[#2d2d2a]/50 italic">(Assists needle pick-up)</span>
        </div>
        <div className="flex bg-[#f5f5f0] p-0.5 rounded-lg border border-[#e2e2d8]">
          <button
            type="button"
            onClick={() => setBeadLabelType('col-sequence')}
            className={`px-3 py-1 rounded-md text-xs font-semibold transition whitespace-nowrap ${
              beadLabelType === 'col-sequence'
                ? 'bg-[#5a5a40] text-white shadow-sm font-bold'
                : 'text-[#2d2d2a]/70 hover:bg-[#ebebe4]'
            }`}
            title="Numbers beads 1, 2, 3... sequentially column-wise for each color"
          >
            🔢 Column Sequence
          </button>
          <button
            type="button"
            onClick={() => setBeadLabelType('row-sequence')}
            className={`px-3 py-1 rounded-md text-xs font-semibold transition whitespace-nowrap ${
              beadLabelType === 'row-sequence'
                ? 'bg-[#5a5a40] text-white shadow-sm font-bold'
                : 'text-[#2d2d2a]/70 hover:bg-[#ebebe4]'
            }`}
            title="Numbers beads 1, 2, 3... sequentially row-wise for each color"
          >
            🔢 Row Sequence
          </button>
          <button
            type="button"
            onClick={() => setBeadLabelType('palette')}
            className={`px-3 py-1 rounded-md text-xs font-semibold transition whitespace-nowrap ${
              beadLabelType === 'palette'
                ? 'bg-[#5a5a40] text-white shadow-sm font-bold'
                : 'text-[#2d2d2a]/70 hover:bg-[#ebebe4]'
            }`}
            title="Displays static global color palette ID number (Color 1, 2, 3...)"
          >
            🎨 Color ID
          </button>
        </div>
      </div>

      {/* Main Wood Tension Frame Container */}
      <div className="relative w-full overflow-hidden flex justify-center py-6 px-4 bg-[#ebebe4] border border-[#e2e2d8] rounded-2xl shadow-inner">
        {/* Tension hoop outer rim (wood texture simulation) */}
        <div className="absolute inset-0 border-[12px] border-[#a07a56] pointer-events-none rounded-2xl z-20 shadow-md"></div>
        {/* Tension hoop metallic wing-nut screw at top */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1.5 w-12 h-4 bg-zinc-400 border border-zinc-500 rounded flex items-center justify-center z-30 shadow-sm pointer-events-none">
          <div className="w-1 h-3 bg-zinc-600"></div>
          <div className="w-5 h-1 bg-zinc-600 rounded"></div>
        </div>

        {/* Scrollable grid stage */}
        <div className="w-full overflow-auto max-h-[580px] py-4 flex flex-col items-center justify-start relative scrollbar-thin scrollbar-thumb-zinc-300">
          <div 
            className="relative transition-all duration-300 rounded shadow-lg p-6 flex flex-col items-center justify-center"
            style={{ backgroundColor: fabricColor }}
          >
            {/* Column Indices Header */}
            <div className="flex mb-1" style={{ paddingLeft: '24px' }}>
              {Array.from({ length: cols }).map((_, c) => {
                const isCurrentInspect = inspectMode === 'column' && inspectIndex === c;
                // Label every 5th col or first/last or current inspect
                const showLabel = c === 0 || c === cols - 1 || (c + 1) % 5 === 0 || isCurrentInspect;
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => {
                      setInspectMode('column');
                      setInspectIndex(c);
                    }}
                    className={`text-[9px] font-mono text-center font-bold transition-all hover:scale-125 focus:outline-none cursor-pointer ${
                      isCurrentInspect ? 'font-extrabold ring-1 ring-yellow-400 bg-yellow-400/20 px-0.5 rounded text-yellow-500' : ''
                    }`}
                    style={{
                      width: `${cellSize}px`,
                      color: isCurrentInspect 
                        ? '#eab308' 
                        : FABRIC_BACKGROUNDS.find(bg => bg.hex === fabricColor)?.text.includes('white') ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)',
                      opacity: showLabel ? 1 : 0.2
                    }}
                    title={`Click to inspect Column ${c + 1}`}
                  >
                    {c + 1}
                  </button>
                );
              })}
            </div>

            {/* Grid Container */}
            <div className="flex flex-col">
              {grid.map((rowArr, rIndex) => (
                <div key={rIndex} className="flex items-center">
                  {/* Row Indices Left */}
                  <button
                    type="button"
                    onClick={() => {
                      setInspectMode('row');
                      setInspectIndex(rIndex);
                    }}
                    className={`text-[9px] font-mono text-right font-bold pr-2 select-none hover:scale-125 transition-all focus:outline-none cursor-pointer ${
                      inspectMode === 'row' && inspectIndex === rIndex ? 'font-extrabold ring-1 ring-yellow-400 bg-yellow-400/20 px-1 rounded text-yellow-500' : ''
                    }`}
                    style={{
                      width: '24px',
                      color: (inspectMode === 'row' && inspectIndex === rIndex)
                        ? '#eab308'
                        : FABRIC_BACKGROUNDS.find(bg => bg.hex === fabricColor)?.text.includes('white') ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)',
                      opacity: (inspectMode === 'row' && inspectIndex === rIndex || rIndex === 0 || rIndex === rows - 1 || (rIndex + 1) % 5 === 0) ? 1 : 0.2
                    }}
                    title={`Click to inspect Row ${rIndex + 1}`}
                  >
                    {rIndex + 1}
                  </button>

                  {/* Beads in Row */}
                  {rowArr.map((cell, cIndex) => {
                    const isSelected = selectedCell?.row === cell.row && selectedCell?.col === cell.col;
                    const isHovered = hoveredCell?.row === cell.row && hoveredCell?.col === cell.col;
                    const isInspectedRow = inspectMode === 'row' && rIndex === inspectIndex;
                    const isInspectedCol = inspectMode === 'column' && cIndex === inspectIndex;
                    
                    return (
                      <div
                        key={cIndex}
                        className={`relative cursor-pointer transition-all duration-100 flex items-center justify-center ${
                          showGridLines ? 'border border-black/10' : ''
                        } ${
                          isInspectedRow ? 'bg-[#5a5a40]/15 ring-[0.5px] ring-[#5a5a40]/30 z-10' : ''
                        } ${
                          isInspectedCol ? 'bg-[#5a5a40]/15 ring-[0.5px] ring-[#5a5a40]/30 z-10' : ''
                        }`}
                        style={{
                          width: `${cellSize}px`,
                          height: `${cellSize}px`,
                        }}
                        onClick={() => handleCellClick(cell)}
                        onMouseEnter={() => setHoveredCell(cell)}
                        onMouseLeave={() => setHoveredCell(null)}
                      >
                        {/* Selected cell glowing frame */}
                        {isSelected && (
                          <div className="absolute inset-0 border-2 border-yellow-400 ring-2 ring-yellow-400/40 animate-pulse z-10 rounded"></div>
                        )}

                        {/* Bead Object */}
                        {!cell.isEmpty && (
                          <div
                            className={`transition-all duration-300 ${
                              beadShape === 'tube' 
                                ? 'w-[85%] h-[60%] rounded-md' 
                                : 'w-[85%] h-[85%] rounded-full'
                            } flex items-center justify-center`}
                            style={getBeadStyle(cell.color, cell.isEmpty)}
                          >
                            {/* Bead Hole (Tambour Stitch Hole) */}
                            <div className="w-[20%] h-[20%] rounded-full bg-black/40"></div>

                            {/* Letter Symbol Overlay */}
                            {showSymbols && cellSize >= 11 && (
                              <span 
                                className="absolute text-[8px] leading-none font-bold select-none text-black/80 font-mono contrast-125 pointer-events-none"
                                style={{ 
                                  fontSize: `${Math.max(6, cellSize * 0.55)}px`,
                                  color: getTextColor(cell.color)
                                }}
                              >
                                {getBeadDisplaySymbol(cell)}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Empty spacing background marker */}
                        {cell.isEmpty && showGridLines && (
                          <div className="w-1 h-1 rounded-full bg-black/15"></div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 🧵 Artisan Row/Column Line-by-Line Bead Inspector */}
      <div className="w-full bg-[#fdfdfb] border border-[#e2e2d8] rounded-xl p-4 shadow-sm text-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#e2e2d8] pb-3 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">🧵</span>
            <div>
              <h3 className="font-bold font-serif italic text-sm text-[#5a5a40]">Line-by-Line Artisan Guide</h3>
              <p className="text-[10.5px] text-[#2d2d2a]/60">Count beads color-wise in a specific row or column</p>
            </div>
          </div>

          {/* Mode Switcher */}
          <div className="flex bg-[#f5f5f0] p-1 rounded-lg border border-[#e2e2d8]">
            <button
              type="button"
              onClick={() => {
                setInspectMode('row');
                setInspectIndex(0);
              }}
              className={`px-3 py-1 rounded-md text-xs font-bold transition flex items-center gap-1.5 ${
                inspectMode === 'row'
                  ? 'bg-[#5a5a40] text-white shadow-sm'
                  : 'text-[#2d2d2a]/70 hover:bg-[#ebebe4]'
              }`}
            >
              <ArrowDown className="w-3.5 h-3.5" />
              <span>Inspect Row</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setInspectMode('column');
                setInspectIndex(0);
              }}
              className={`px-3 py-1 rounded-md text-xs font-bold transition flex items-center gap-1.5 ${
                inspectMode === 'column'
                  ? 'bg-[#5a5a40] text-white shadow-sm'
                  : 'text-[#2d2d2a]/70 hover:bg-[#ebebe4]'
              }`}
            >
              <ArrowRight className="w-3.5 h-3.5" />
              <span>Inspect Column</span>
            </button>
          </div>
        </div>

        {/* Navigation Selector & Quick Jumper */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-[#f5f5f0]/40 p-3 rounded-lg border border-[#e2e2d8]/60 mb-3.5">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#2d2d2a]/80 capitalize">Select {inspectMode}:</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setInspectIndex(prev => Math.max(0, prev - 1))}
                disabled={inspectIndex === 0}
                className="p-1 rounded bg-[#fdfdfb] hover:bg-[#ebebe4] border border-[#e2e2d8] disabled:opacity-45 disabled:hover:bg-[#fdfdfb] transition text-[#5a5a40]"
                title={`Previous ${inspectMode}`}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              <select
                value={inspectIndex}
                onChange={(e) => setInspectIndex(Number(e.target.value))}
                className="px-2 py-1 bg-[#fdfdfb] border border-[#e2e2d8] rounded font-mono font-bold text-xs text-[#5a5a40] focus:ring-1 focus:ring-[#5a5a40] outline-none"
              >
                {Array.from({ length: inspectMode === 'row' ? rows : cols }).map((_, idx) => (
                  <option key={idx} value={idx}>
                    {inspectMode === 'row' ? `Row ${idx + 1}` : `Column ${idx + 1}`}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => setInspectIndex(prev => Math.min((inspectMode === 'row' ? rows : cols) - 1, prev + 1))}
                disabled={inspectIndex === (inspectMode === 'row' ? rows : cols) - 1}
                className="p-1 rounded bg-[#fdfdfb] hover:bg-[#ebebe4] border border-[#e2e2d8] disabled:opacity-45 disabled:hover:bg-[#fdfdfb] transition text-[#5a5a40]"
                title={`Next ${inspectMode}`}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="text-[11px] text-[#2d2d2a]/60">
            Total Beads on this line: <span className="font-mono font-bold text-[#5a5a40] bg-[#5a5a40]/10 px-1.5 py-0.5 rounded text-xs">{inspectedTotal} pcs</span>
          </div>
        </div>

        {/* Color-wise Beads Grid Breakdown results */}
        <div>
          {inspectedColors.length === 0 ? (
            <div className="py-4 text-center text-[#2d2d2a]/40 bg-[#fdfdfb] border border-dashed border-[#e2e2d8] rounded-lg">
              No beads found in {inspectMode === 'row' ? `Row ${inspectIndex + 1}` : `Column ${inspectIndex + 1}`}. This line consists entirely of raw background fabric.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {inspectedColors.map(({ color, count, symbol, name }) => (
                <div 
                  key={color} 
                  className="flex items-center justify-between p-2 rounded-lg bg-[#fdfdfb] border border-[#e2e2d8] shadow-sm hover:border-[#5a5a40]/30 transition"
                >
                  <div className="flex items-center gap-2">
                    {/* Visual representation of the bead */}
                    <div 
                      className="w-7 h-7 rounded-full flex items-center justify-center border border-black/10 relative shadow-inner"
                      style={{ backgroundColor: color }}
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-black/35"></div>
                      <span 
                        className="absolute text-[9px] font-bold select-none font-mono"
                        style={{ color: getTextColor(color) }}
                      >
                        {symbol}
                      </span>
                    </div>
                    <div>
                      <p className="font-bold text-[#2d2d2a]/90 text-[11px] truncate max-w-[120px]">{name}</p>
                      <p className="text-[9.5px] text-[#2d2d2a]/50 font-mono">Symbol: {symbol}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-[#5a5a40] bg-[#5a5a40]/10 px-2 py-0.5 rounded text-[11.5px] whitespace-nowrap">
                      {count} beads
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Floating Interactive HUD Status */}
      <div className="w-full bg-[#fdfdfb] border border-[#e2e2d8] rounded-xl p-4 shadow-sm text-xs relative flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {hoveredCell && !hoveredCell.isEmpty ? (
          <div className="flex items-center gap-3">
            <div 
              className="w-8 h-8 rounded-full shadow-inner border border-black/10"
              style={{ backgroundColor: hoveredCell.color }}
            />
            <div>
              <p className="font-semibold text-[#5a5a40]">
                Bead Symbol: <span className="font-mono bg-[#f5f5f0] px-1.5 py-0.5 rounded text-sm text-[#2d2d2a]">{hoveredCell.symbol}</span>
              </p>
              <p className="text-[#2d2d2a]/60 text-[10.5px]">
                Coordinate: Row {hoveredCell.row + 1}, Col {hoveredCell.col + 1}
              </p>
            </div>
          </div>
        ) : selectedCell && !selectedCell.isEmpty ? (
          <div className="flex items-center gap-3">
            <div 
              className="w-8 h-8 rounded-full ring-2 ring-yellow-400/80 border border-black/10"
              style={{ backgroundColor: selectedCell.color }}
            />
            <div>
              <p className="font-semibold text-[#5a5a40]">
                Pinpoint Selection: <span className="font-mono bg-[#f5f5f0] px-1.5 py-0.5 rounded text-sm text-[#2d2d2a]">{selectedCell.symbol}</span>
              </p>
              <p className="text-[#2d2d2a]/60 text-[10.5px]">
                Stitch Coordinate: Row <span className="font-bold text-[#5a5a40]">{selectedCell.row + 1}</span>, Col <span className="font-bold text-[#5a5a40]">{selectedCell.col + 1}</span>
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-[#2d2d2a]/50">
            <Info className="w-4 h-4 text-[#5a5a40]" />
            <span>Hover or click any bead to view grid coordinates & color names.</span>
          </div>
        )}

        <div className="flex items-center gap-1.5 text-[11px] bg-[#f5f5f0] px-3 py-1.5 rounded-lg border border-[#e2e2d8] text-[#5a5a40] font-mono self-start sm:self-auto font-bold">
          <span>Total: {pattern.totalBeads} beads</span>
          <span className="opacity-40">|</span>
          <span className="capitalize">{pattern.beadShape} Shape</span>
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
