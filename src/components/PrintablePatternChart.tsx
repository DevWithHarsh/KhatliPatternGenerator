import { useMemo, useState } from 'react';
import { GeneratedBeadPattern, BeadCell } from '../types';
import { Printer, X, Download, Info, FileSpreadsheet, Loader2 } from 'lucide-react';
import ExcelJS from 'exceljs';

interface PrintablePatternChartProps {
  pattern: GeneratedBeadPattern | null;
  fabricColor: string;
  beadLabelType?: 'col-sequence' | 'row-sequence' | 'palette';
  onClose: () => void;
}

export default function PrintablePatternChart({
  pattern,
  fabricColor,
  beadLabelType = 'col-sequence',
  onClose
}: PrintablePatternChartProps) {
  if (!pattern) return null;

  const [isExportingExcel, setIsExportingExcel] = useState<boolean>(false);

  const { rows, cols, grid, palette, totalBeads, beadShape } = pattern;

  // Pre-calculate sequential bead numbers row-wise and column-wise for printable sheet
  const sequenceGrid = useMemo(() => {
    const colSequences: number[][] = Array.from({ length: rows }, () => Array(cols).fill(0));
    const rowSequences: number[][] = Array.from({ length: rows }, () => Array(cols).fill(0));
    
    // Column sequences
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
    
    // Row sequences
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
  }, [grid, rows, cols]);

  // Helper to get active display symbol for a bead cell on the print sheet
  const getBeadDisplaySymbol = (cell: BeadCell) => {
    if (beadLabelType === 'palette') {
      return cell.symbol;
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

  const handlePrint = () => {
    window.print();
  };

  // Helper to determine text contrast (light or dark text) in Excel
  const getContrastColorIsDark = (hex: string) => {
    try {
      if (!hex || !hex.startsWith('#')) return true;
      const r = parseInt(hex.substring(1, 3), 16);
      const g = parseInt(hex.substring(3, 5), 16);
      const b = parseInt(hex.substring(5, 7), 16);
      const brightness = (r * 299 + g * 587 + b * 114) / 1000;
      return brightness > 140; // true = light background (use black text), false = dark background (use white text)
    } catch (e) {
      return true;
    }
  };

  const handleExportExcel = async () => {
    setIsExportingExcel(true);
    try {
      // Create workbook & worksheet
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Embroidery Beadwork Pattern');

      // 1. Grid Title block
      worksheet.getCell('B2').value = 'ARTISAN BEADWORK EMBROIDERY PATTERN';
      worksheet.getCell('B2').font = { name: 'Georgia', size: 16, bold: true, color: { argb: 'FF3F3F2E' } };

      worksheet.getCell('B3').value = `Grid Dimensions: ${rows} Rows × ${cols} Columns | Total Beads: ${totalBeads} | Pattern Type: ${beadShape} Bead`;
      worksheet.getCell('B3').font = { name: 'Calibri', size: 10, italic: true, color: { argb: 'FF555555' } };

      const numberingDesc = beadLabelType === 'col-sequence'
        ? 'Numbered sequentially column-wise for each distinct color'
        : beadLabelType === 'row-sequence'
        ? 'Numbered sequentially row-wise for each distinct color'
        : 'Numbered by Color Palette ID';
      
      worksheet.getCell('B4').value = `Active Numbering Mode: ${beadLabelType === 'col-sequence' ? 'Column Sequence' : beadLabelType === 'row-sequence' ? 'Row Sequence' : 'Color Palette ID'} (${numberingDesc})`;
      worksheet.getCell('B4').font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF5A5A40' } };

      // Make columns square
      // Excel column widths are roughly in character units. A width of 4.5 gives ~36px, and row height of 24 gives ~32px.
      worksheet.getColumn(1).width = 5; // Column A (Row index header)
      for (let c = 0; c < cols; c++) {
        const xlCol = worksheet.getColumn(c + 2); // Start from Column B
        xlCol.width = 4.5;
      }

      // 2. Set Row 6 to be the Column Numbers header
      const headerRow = worksheet.getRow(6);
      headerRow.height = 20;
      for (let c = 0; c < cols; c++) {
        const xlCell = worksheet.getCell(6, c + 2);
        xlCell.value = c + 1;
        xlCell.alignment = { horizontal: 'center', vertical: 'middle' };
        xlCell.font = { name: 'Calibri', size: 8, bold: true, color: { argb: 'FF888888' } };
        xlCell.border = {
          bottom: { style: 'medium', color: { argb: 'FF5A5A40' } }
        };
      }

      // 3. Write grid of beads (starting from Row 7)
      for (let r = 0; r < rows; r++) {
        const rowNum = 7 + r;
        const xlRow = worksheet.getRow(rowNum);
        xlRow.height = 24; // Square aspect ratio

        // Row header label in Column A
        const rowHeaderCell = worksheet.getCell(rowNum, 1);
        rowHeaderCell.value = r + 1;
        rowHeaderCell.alignment = { horizontal: 'right', vertical: 'middle' };
        rowHeaderCell.font = { name: 'Calibri', size: 8, bold: true, color: { argb: 'FF888888' } };
        rowHeaderCell.border = {
          right: { style: 'medium', color: { argb: 'FF5A5A40' } }
        };

        // Write each column bead
        for (let c = 0; c < cols; c++) {
          const cellData = grid[r]?.[c];
          const xlCell = worksheet.getCell(rowNum, c + 2);

          // Standard light grid border
          xlCell.border = {
            top: { style: 'thin', color: { argb: 'FFE2E2D8' } },
            left: { style: 'thin', color: { argb: 'FFE2E2D8' } },
            bottom: { style: 'thin', color: { argb: 'FFE2E2D8' } },
            right: { style: 'thin', color: { argb: 'FFE2E2D8' } }
          };

          if (cellData && !cellData.isEmpty) {
            // Hex color formatting: e.g. '#FAF9F6' -> 'FFFAF9F6'
            const rawColor = cellData.color;
            let hexColor = 'FFFFFF';
            if (rawColor.startsWith('#')) {
              hexColor = rawColor.substring(1).toUpperCase();
            }
            if (hexColor.length === 3) {
              hexColor = hexColor[0] + hexColor[0] + hexColor[1] + hexColor[1] + hexColor[2] + hexColor[2];
            }

            // Apply bead background color fill
            xlCell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FF' + hexColor }
            };

            // Display active bead numbering symbol
            const displaySymbol = getBeadDisplaySymbol(cellData);
            xlCell.value = displaySymbol;

            // Apply readable high-contrast font color over the cell fill
            const isDark = getContrastColorIsDark(rawColor);
            xlCell.font = {
              name: 'Calibri',
              size: 9,
              bold: true,
              color: { argb: isDark ? 'FF000000' : 'FFFFFFFF' }
            };

            xlCell.alignment = {
              horizontal: 'center',
              vertical: 'middle'
            };
          } else {
            // Empty cell styling (fabric base preview)
            xlCell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFF5F5F0' } // Soft cloth background
            };
          }
        }
      }

      // 4. Color Palette Table Legend
      const startRowPalette = 7 + rows + 3;
      
      worksheet.getCell(`B${startRowPalette}`).value = 'COLOR PALETTE LEGEND';
      worksheet.getCell(`B${startRowPalette}`).font = { name: 'Georgia', size: 12, bold: true, color: { argb: 'FF3F3F2E' } };

      const paletteRowHeader = worksheet.getRow(startRowPalette + 1);
      paletteRowHeader.height = 20;

      // Labels & Merge Layout
      const headers = [
        { col: 2, val: 'ID', width: 6 },
        { col: 3, val: 'Color Block', width: 14 },
        { col: 4, val: 'Color Name', width: 20 },
        { col: 5, val: 'Hex Code', width: 12 },
        { col: 6, val: 'Bead Count', width: 12 }
      ];

      headers.forEach(h => {
        const cell = worksheet.getCell(startRowPalette + 1, h.col);
        cell.value = h.val;
        cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF5A5A40' }
        };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      });

      // Write palette rows
      palette.forEach((colorItem, idx) => {
        const itemRow = startRowPalette + 2 + idx;
        const xlRow = worksheet.getRow(itemRow);
        xlRow.height = 20;

        // ID
        const idCell = worksheet.getCell(itemRow, 2);
        idCell.value = colorItem.symbol;
        idCell.font = { name: 'Calibri', size: 10, bold: true };
        idCell.alignment = { horizontal: 'center', vertical: 'middle' };
        idCell.border = { bottom: { style: 'thin', color: { argb: 'FFE2E2D8' } } };

        // Color Block
        const blockCell = worksheet.getCell(itemRow, 3);
        let palHex = colorItem.hex.startsWith('#') ? colorItem.hex.substring(1).toUpperCase() : 'FFFFFF';
        if (palHex.length === 3) {
          palHex = palHex[0] + palHex[0] + palHex[1] + palHex[1] + palHex[2] + palHex[2];
        }
        blockCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF' + palHex }
        };
        blockCell.border = {
          top: { style: 'thin', color: { argb: 'FFCCCCCC' } },
          left: { style: 'thin', color: { argb: 'FFCCCCCC' } },
          bottom: { style: 'thin', color: { argb: 'FFCCCCCC' } },
          right: { style: 'thin', color: { argb: 'FFCCCCCC' } }
        };

        // Color Name
        const nameCell = worksheet.getCell(itemRow, 4);
        nameCell.value = colorItem.name;
        nameCell.font = { name: 'Calibri', size: 10 };
        nameCell.alignment = { horizontal: 'left', vertical: 'middle' };
        nameCell.border = { bottom: { style: 'thin', color: { argb: 'FFE2E2D8' } } };

        // Hex Code
        const hexCell = worksheet.getCell(itemRow, 5);
        hexCell.value = colorItem.hex.toUpperCase();
        hexCell.font = { name: 'Courier New', size: 9 };
        hexCell.alignment = { horizontal: 'center', vertical: 'middle' };
        hexCell.border = { bottom: { style: 'thin', color: { argb: 'FFE2E2D8' } } };

        // Count
        const countCell = worksheet.getCell(itemRow, 6);
        countCell.value = colorItem.count;
        countCell.font = { name: 'Calibri', size: 10, bold: true };
        countCell.alignment = { horizontal: 'right', vertical: 'middle' };
        countCell.border = { bottom: { style: 'thin', color: { argb: 'FFE2E2D8' } } };
      });

      // Write to buffer and download
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `Beadwork_Embroidery_Pattern_${rows}x${cols}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error('Failed to export to Excel:', err);
      alert('Failed to generate Excel file. Please try again.');
    } finally {
      setIsExportingExcel(false);
    }
  };

  // Helper to determine text contrast over a color
  const getContrastColor = (hex: string) => {
    const r = parseInt(hex.substring(1, 3), 16);
    const g = parseInt(hex.substring(3, 5), 16);
    const b = parseInt(hex.substring(5, 7), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 140 ? 'text-black' : 'text-white';
  };

  const isInIframe = useMemo(() => {
    try {
      return typeof window !== 'undefined' && window.self !== window.top;
    } catch (e) {
      return true;
    }
  }, []);

  return (
    <div className="fixed inset-0 bg-black/60 z-50 overflow-y-auto p-4 sm:p-8 flex justify-center items-start print:p-0 print:bg-white print:static print:inset-auto">
      
      {/* Container */}
      <div className="bg-white text-black w-full max-w-5xl rounded-2xl shadow-2xl p-6 sm:p-10 relative flex flex-col gap-6 print:shadow-none print:p-0 print:rounded-none">
        
        {/* Buttons (Hidden on Print) */}
        <div className="flex justify-between items-center border-b border-zinc-200 pb-4 no-print">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📿</span>
            <div>
              <h2 className="text-base font-bold font-serif italic text-zinc-800">
                Artisan Beadwork Pattern Sheet
              </h2>
              <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
                Optimized for High-Contrast Colored Embroidery Layout
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportExcel}
              disabled={isExportingExcel}
              className="flex items-center gap-1.5 bg-[#1f7246] hover:bg-[#185936] disabled:bg-[#1f7246]/50 text-white px-4 py-2 rounded-lg text-xs font-bold transition shadow-sm"
              title="Export bead pattern as styled Excel sheet (.xlsx) with actual colored cells"
            >
              {isExportingExcel ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FileSpreadsheet className="w-4 h-4" />
              )}
              <span>{isExportingExcel ? 'Exporting...' : 'Export to Excel (.xlsx)'}</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 bg-[#5a5a40] hover:bg-[#4a4a30] text-white px-4 py-2 rounded-lg text-xs font-bold transition shadow-sm"
              title={isInIframe ? "Printing is restricted inside browser preview iframes" : "Print Pattern"}
            >
              <Printer className="w-4 h-4" />
              <span>Print Blueprint</span>
            </button>
            <button
              onClick={onClose}
              className="flex items-center justify-center p-2 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition"
              title="Close Panel"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Iframe warning notice */}
        {isInIframe && (
          <div className="bg-[#fdf3e7] border border-[#f5d0a9] text-[#7c4d12] p-4 rounded-xl flex gap-3 text-xs leading-relaxed no-print shadow-sm">
            <Info className="w-5 h-5 text-[#c67a13] flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-[#9c5f0a]">⚠️ Browser Preview Print Restriction</p>
              <p className="mt-1">
                Because this app is running in a secure sandbox preview, your web browser blocks the <strong>Print</strong> action from opening.
              </p>
              <p className="mt-1.5 font-semibold text-[#804f05]">
                👉 To print successfully: Click the <strong className="bg-[#f5e6d3] px-1 py-0.5 rounded border border-[#e8d1b5]">"Open in a new tab"</strong> icon in the top-right corner of this screen, then open this chart and click <strong>Print Blueprint</strong> again!
              </p>
            </div>
          </div>
        )}

        {/* PRINT CONTENT STARTS HERE */}
        <div className="flex flex-col gap-6">
          {/* Document Header */}
          <div className="flex flex-col md:flex-row md:justify-between border-b-2 border-zinc-800 pb-4 gap-4">
            <div>
              <h1 className="text-2xl font-serif italic font-bold text-zinc-900">
                Khatli Moti Embroidery Chart
              </h1>
              <p className="text-xs text-zinc-500 mt-1">
                Generated from reference digital artwork. Suitable for tracing paper transfers (Khakas).
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-x-4 gap-y-1.5 text-xs">
              <div>
                <span className="text-zinc-400 block text-[10px] uppercase font-bold">Grid Dimensions</span>
                <span className="font-mono font-bold text-zinc-800">{rows} rows × {cols} cols</span>
              </div>
              <div>
                <span className="text-zinc-400 block text-[10px] uppercase font-bold">Total Bead Count</span>
                <span className="font-mono font-bold text-zinc-800">{totalBeads} beads</span>
              </div>
              <div>
                <span className="text-zinc-400 block text-[10px] uppercase font-bold">Bead Profile</span>
                <span className="font-bold text-zinc-800 capitalize">{beadShape} Moti</span>
              </div>
              <div>
                <span className="text-zinc-400 block text-[10px] uppercase font-bold">Palette Size</span>
                <span className="font-mono font-bold text-zinc-800">{palette.length} Colors</span>
              </div>
              <div>
                <span className="text-zinc-400 block text-[10px] uppercase font-bold">Bead Numbers</span>
                <span className="font-bold text-[#5a5a40] capitalize">
                  {beadLabelType === 'col-sequence' && 'Column Sequence (1,2,3...)'}
                  {beadLabelType === 'row-sequence' && 'Row Sequence (1,2,3...)'}
                  {beadLabelType === 'palette' && 'Palette Color ID'}
                </span>
              </div>
            </div>
          </div>

          {/* Grid Blueprint Map */}
          <div className="flex flex-col items-center justify-center bg-zinc-50 border border-zinc-200 p-4 rounded-xl print:bg-white print:border-0 print:p-0">
            <h3 className="text-xs font-bold text-zinc-700 mb-3 uppercase tracking-wider no-print">
              Visual Grid Preview (Colored Embroidery Chart)
            </h3>
            
            <div className="w-full overflow-auto max-w-full flex justify-center py-2">
              <div className="bg-white p-4 border border-zinc-300 rounded flex flex-col items-center select-none print:border-0 print:p-0">
                
                {/* Columns Header (x) */}
                <div className="flex" style={{ paddingLeft: '20px' }}>
                  {Array.from({ length: cols }).map((_, c) => (
                    <div
                      key={c}
                      className="text-[8px] font-mono text-center font-bold"
                      style={{ width: '12px', opacity: (c === 0 || c === cols - 1 || (c + 1) % 5 === 0) ? 1 : 0.3 }}
                    >
                      {c + 1}
                    </div>
                  ))}
                </div>

                {/* Grid */}
                <div className="flex flex-col border border-zinc-400">
                  {grid.map((rowArr, rIndex) => (
                    <div key={rIndex} className="flex items-center">
                      
                      {/* Row Header (y) */}
                      <div
                        className="text-[8px] font-mono text-right font-bold pr-1 select-none text-zinc-400"
                        style={{ width: '16px' }}
                      >
                        {(rIndex === 0 || rIndex === rows - 1 || (rIndex + 1) % 5 === 0) ? rIndex + 1 : ''}
                      </div>

                      {/* Cells */}
                      {rowArr.map((cell, cIndex) => (
                        <div
                          key={cIndex}
                          className={`w-3 h-3 border border-zinc-200/50 flex items-center justify-center font-mono text-[7px] font-bold ${
                            cell.isEmpty ? '' : getContrastColor(cell.color)
                          }`}
                          style={{
                            backgroundColor: cell.isEmpty ? 'transparent' : cell.color,
                            WebkitPrintColorAdjust: 'exact',
                            printColorAdjust: 'exact'
                          } as any}
                        >
                          {!cell.isEmpty && getBeadDisplaySymbol(cell)}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <p className="text-[10px] text-zinc-400 mt-2 text-center no-print">
              Tip: The printed grid makes it extremely easy to prick holes on tracing paper for Khaka stencils.
            </p>
          </div>

          {/* Bead Purchasing Legend */}
          <div className="mt-2">
            <h3 className="text-xs font-bold text-zinc-800 uppercase tracking-wider mb-3 border-b border-zinc-300 pb-1">
              Bead Material Index &amp; Purchase List
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {palette.map((bead) => (
                <div
                  key={bead.colorId}
                  className="flex items-center justify-between border-b border-zinc-200 py-2 text-xs"
                >
                  <div className="flex items-center gap-3">
                    {/* Circle Swatch */}
                    <div 
                      className="w-6 h-6 rounded-full border border-zinc-400 flex items-center justify-center font-mono font-bold text-[10px]"
                      style={{ backgroundColor: bead.hex }}
                    >
                      <span className={getContrastColor(bead.hex)}>{bead.symbol}</span>
                    </div>

                    <div>
                      <p className="font-bold text-zinc-800">{bead.name}</p>
                      <p className="text-[10px] text-zinc-500 font-mono uppercase">Code: {bead.symbol} | HEX: {bead.hex}</p>
                    </div>
                  </div>

                  <div className="text-right flex items-center gap-4">
                    <div>
                      <p className="font-mono font-bold text-zinc-900">{bead.count} Beads</p>
                      <p className="text-[10px] text-zinc-500">
                        ~{(bead.count / 80).toFixed(1)}g packet
                      </p>
                    </div>
                    {/* Checkbox for purchasing */}
                    <div className="w-4 h-4 border border-zinc-400 rounded bg-white flex items-center justify-center print:border-zinc-500">
                      <div className="w-2 h-2 rounded-sm bg-transparent"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer Guide Notes */}
          <div className="border-t-2 border-zinc-800 pt-4 flex flex-col sm:flex-row sm:justify-between text-[10px] text-zinc-500 gap-2">
            <span>Grid generated via Digital Khatli Studio.</span>
            <span>Artisan Reference Sheet — Please handle with care.</span>
          </div>

        </div>

      </div>
    </div>
  );
}
