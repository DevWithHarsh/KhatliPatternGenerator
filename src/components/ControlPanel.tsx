import React, { useState, useRef, useEffect } from 'react';
import { SAMPLE_PATTERNS, SamplePattern } from '../presets';
import { generateBeadsFromImage } from '../utils/imageProcessor';
import { GeneratedBeadPattern, BeadShape } from '../types';
import { Upload, Sliders, Image as ImageIcon, Grid, Sparkles, RefreshCw, Layers, ShieldAlert, Check } from 'lucide-react';

interface ControlPanelProps {
  onPatternGenerated: (pattern: GeneratedBeadPattern) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export default function ControlPanel({
  onPatternGenerated,
  isLoading,
  setIsLoading
}: ControlPanelProps) {
  const [selectedSample, setSelectedSample] = useState<SamplePattern | null>(SAMPLE_PATTERNS[0]);
  const [customImageSrc, setCustomImageSrc] = useState<string | null>(null);
  const [imageName, setImageName] = useState<string | null>(null);

  // Settings state
  const [rows, setRows] = useState<number>(36);
  const [cols, setCols] = useState<number>(36);
  const [maxColors, setMaxColors] = useState<number>(8);
  const [beadShape, setBeadShape] = useState<BeadShape>('round');
  const [symmetry, setSymmetry] = useState<'none' | 'horizontal' | 'vertical' | 'dual'>('none');
  const [ignoreWhiteBg, setIgnoreWhiteBg] = useState<boolean>(true);

  // Image Filter Adjustments
  const [brightness, setBrightness] = useState<number>(0);
  const [contrast, setContrast] = useState<number>(0);
  const [saturation, setSaturation] = useState<number>(0);

  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Trigger generation whenever image or parameters change
  const triggerGeneration = async (imgSrc: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const generated = await generateBeadsFromImage(
        imgSrc,
        rows,
        cols,
        maxColors,
        beadShape,
        brightness,
        contrast,
        saturation,
        symmetry,
        ignoreWhiteBg
      );
      onPatternGenerated(generated);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error generating beads pattern.');
    } finally {
      setIsLoading(false);
    }
  };

  // Run generation once on initial mount with default preset
  useEffect(() => {
    if (selectedSample) {
      triggerGeneration(selectedSample.svgDataUri);
    }
  }, []);

  // Handle preset loading
  const handleLoadSample = (sample: SamplePattern) => {
    setSelectedSample(sample);
    setCustomImageSrc(null);
    setImageName(null);
    setRows(sample.defaultRows);
    setCols(sample.defaultCols);
    // Trigger pattern generation for this sample
    triggerGeneration(sample.svgDataUri);
  };

  // Handle custom image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setImageName(file.name);
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const b64 = event.target?.result as string;
      setCustomImageSrc(b64);
      setSelectedSample(null);
      triggerGeneration(b64);
    };
    reader.onerror = () => {
      setError('Could not parse image file.');
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setError(null);
      setImageName(file.name);
      
      const reader = new FileReader();
      reader.onload = (event) => {
        const b64 = event.target?.result as string;
        setCustomImageSrc(b64);
        setSelectedSample(null);
        triggerGeneration(b64);
      };
      reader.readAsDataURL(file);
    } else {
      setError('Please drop an image file.');
    }
  };

  const handleGenerateClick = () => {
    const activeSrc = customImageSrc || selectedSample?.svgDataUri;
    if (activeSrc) {
      triggerGeneration(activeSrc);
    } else {
      setError('Please upload an image or load a preset first.');
    }
  };

  const activeSrc = customImageSrc || selectedSample?.svgDataUri;

  return (
    <div className="flex flex-col gap-5 w-full bg-[#fdfdfb] border border-[#e2e2d8] rounded-xl p-5 text-[#2d2d2a] shadow-sm">
      
      {/* 1. Image Upload Section */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <ImageIcon className="w-5 h-5 text-[#5a5a40]" />
          <h2 className="text-sm font-semibold tracking-wider uppercase text-[#5a5a40] font-sans">
            1. Source Design Image
          </h2>
        </div>

        {/* File Drag / Drop Dropzone */}
        <div
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2 min-h-[120px] ${
            customImageSrc 
              ? 'border-emerald-500 bg-emerald-50/10' 
              : 'border-[#e2e2d8] hover:border-[#5a5a40]/60 bg-[#f5f5f0]/30 hover:bg-[#ebebe4]/30'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
          
          {customImageSrc ? (
            <div className="flex flex-col items-center gap-1.5">
              <div className="relative w-16 h-16 rounded border border-emerald-200 overflow-hidden shadow-sm">
                <img src={customImageSrc} alt="custom upload" className="w-full h-full object-cover" />
                <div className="absolute top-0 right-0 bg-emerald-500 p-0.5 rounded-bl">
                  <Check className="w-3.5 h-3.5 text-white" />
                </div>
              </div>
              <span className="text-xs font-semibold text-emerald-800 truncate max-w-[200px]">
                {imageName || 'custom_image.png'}
              </span>
              <span className="text-[10px] text-zinc-400">Click or drop to replace</span>
            </div>
          ) : (
            <>
              <Upload className="w-6 h-6 text-[#5a5a40]/60" />
              <div>
                <p className="text-xs font-bold text-[#2d2d2a]/80">
                  Upload Artisan Artwork (Sketch/Photo)
                </p>
                <p className="text-[10px] text-[#2d2d2a]/50 mt-0.5">
                  Drag & drop or browse from your device
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Quick Samples Section */}
      <div>
        <p className="text-[10.5px] font-bold text-[#2d2d2a]/40 uppercase tracking-wider mb-2">
          Or Quick-Load Traditional Motif:
        </p>
        <div className="grid grid-cols-3 gap-1.5">
          {SAMPLE_PATTERNS.map((sample) => {
            const isSelected = selectedSample?.name === sample.name;
            return (
              <button
                key={sample.name}
                type="button"
                onClick={() => handleLoadSample(sample)}
                className={`text-[10.5px] p-2 rounded-lg border text-left flex flex-col gap-1 transition-all ${
                  isSelected
                    ? 'border-[#5a5a40] bg-[#5a5a40]/5 text-[#5a5a40] font-bold shadow-sm'
                    : 'border-[#e2e2d8] bg-[#fdfdfb] hover:bg-[#f5f5f0] text-[#2d2d2a]/70'
                }`}
              >
                <div className="w-full h-10 rounded border border-[#e2e2d8] overflow-hidden bg-white flex items-center justify-center p-0.5">
                  <img src={sample.svgDataUri} alt={sample.name} className="h-full object-contain" />
                </div>
                <span className="truncate w-full font-semibold">{sample.name.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>
      </div>

      <hr className="border-[#e2e2d8]" />

      {/* 2. Grid Dimensions & Parameters */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Grid className="w-5 h-5 text-[#5a5a40]" />
          <h2 className="text-sm font-semibold tracking-wider uppercase text-[#5a5a40] font-sans">
            2. Bead Grid Configuration
          </h2>
        </div>

        <div className="flex flex-col gap-3.5 text-xs">
          
          {/* Sliders for Rows & Columns */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="font-bold text-[#2d2d2a]/70">Row Count:</span>
                <span className="font-mono font-bold text-[#5a5a40] bg-[#5a5a40]/10 px-1.5 py-0.5 rounded text-[11px]">{rows} rows</span>
              </div>
              <input
                type="range"
                min="10"
                max="150"
                step="1"
                value={rows}
                onChange={(e) => setRows(Number(e.target.value))}
                className="w-full accent-[#5a5a40]"
              />
              <p className="text-[9px] text-zinc-400 mt-0.5">Vertical grid height</p>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="font-bold text-[#2d2d2a]/70">Column Count:</span>
                <span className="font-mono font-bold text-[#5a5a40] bg-[#5a5a40]/10 px-1.5 py-0.5 rounded text-[11px]">{cols} cols</span>
              </div>
              <input
                type="range"
                min="10"
                max="150"
                step="1"
                value={cols}
                onChange={(e) => setCols(Number(e.target.value))}
                className="w-full accent-[#5a5a40]"
              />
              <p className="text-[9px] text-zinc-400 mt-0.5">Horizontal grid width</p>
            </div>
          </div>

          {/* Max Bead Colors & Bead Shape */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="font-bold text-[#2d2d2a]/70">Max Colors (Palette):</span>
                <span className="font-mono font-bold text-[#5a5a40] bg-[#5a5a40]/10 px-1.5 py-0.5 rounded text-[11px]">{maxColors} max</span>
              </div>
              <input
                type="range"
                min="2"
                max="16"
                step="1"
                value={maxColors}
                onChange={(e) => setMaxColors(Number(e.target.value))}
                className="w-full accent-[#5a5a40]"
              />
              <p className="text-[9px] text-zinc-400 mt-0.5">Limits unique bead types</p>
            </div>

            <div>
              <span className="font-bold text-[#2d2d2a]/70 block mb-1">Bead Shape / Texture:</span>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => setBeadShape('round')}
                  className={`py-1 rounded border text-center font-bold text-[11px] transition ${
                    beadShape === 'round'
                      ? 'bg-[#5a5a40] text-white border-[#5a5a40] shadow-sm'
                      : 'border-[#e2e2d8] bg-[#fdfdfb] hover:bg-[#f5f5f0] text-[#2d2d2a]/70'
                  }`}
                >
                  🔴 Round Moti
                </button>
                <button
                  type="button"
                  onClick={() => setBeadShape('tube')}
                  className={`py-1 rounded border text-center font-bold text-[11px] transition ${
                    beadShape === 'tube'
                      ? 'bg-[#5a5a40] text-white border-[#5a5a40] shadow-sm'
                      : 'border-[#e2e2d8] bg-[#fdfdfb] hover:bg-[#f5f5f0] text-[#2d2d2a]/70'
                  }`}
                >
                  🪵 Cut-Pipes
                </button>
              </div>
            </div>
          </div>

          {/* Ignore White Background & Symmetry */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="font-bold text-[#2d2d2a]/70 block mb-1">Symmetry Mirroring:</span>
              <select
                value={symmetry}
                onChange={(e) => setSymmetry(e.target.value as any)}
                className="w-full px-2.5 py-1.5 rounded border border-[#e2e2d8] bg-[#fdfdfb] text-xs focus:ring-1 focus:ring-[#5a5a40] focus:border-[#5a5a40] outline-none text-[#2d2d2a]"
              >
                <option value="none">None (Asymmetrical)</option>
                <option value="horizontal">Horizontal (Left/Right)</option>
                <option value="vertical">Vertical (Top/Bottom)</option>
                <option value="dual">Dual Mirror (Symmetric)</option>
              </select>
            </div>

            <div className="flex flex-col justify-end">
              <label className="flex items-center gap-2 cursor-pointer bg-[#f5f5f0]/50 border border-[#e2e2d8] p-2 rounded-lg hover:bg-[#f5f5f0] transition">
                <input
                  type="checkbox"
                  checked={ignoreWhiteBg}
                  onChange={(e) => setIgnoreWhiteBg(e.target.checked)}
                  className="accent-[#5a5a40] rounded w-4 h-4"
                />
                <div className="flex flex-col">
                  <span className="font-bold text-[11px]">Ignore White BG</span>
                  <span className="text-[9px] text-[#2d2d2a]/50">White area = empty fabric</span>
                </div>
              </label>
            </div>
          </div>

        </div>
      </div>

      <hr className="border-[#e2e2d8]" />

      {/* 3. Advanced Image Tuning (Sliders) */}
      <div>
        <div className="flex items-center gap-2 mb-2.5">
          <Sliders className="w-5 h-5 text-[#5a5a40]" />
          <h2 className="text-sm font-semibold tracking-wider uppercase text-[#5a5a40] font-sans">
            3. Image Pre-processing
          </h2>
        </div>

        <div className="flex flex-col gap-2.5 text-xs bg-[#f5f5f0]/40 p-3.5 rounded-xl border border-[#e2e2d8]/60">
          <div>
            <div className="flex justify-between text-[11px] mb-0.5">
              <span className="font-semibold text-[#2d2d2a]/70">Brightness Tuning:</span>
              <span className="font-mono font-semibold text-[#5a5a40]">{brightness > 0 ? `+${brightness}` : brightness}%</span>
            </div>
            <input
              type="range"
              min="-60"
              max="60"
              value={brightness}
              onChange={(e) => setBrightness(Number(e.target.value))}
              className="w-full accent-[#5a5a40] h-1"
            />
          </div>

          <div>
            <div className="flex justify-between text-[11px] mb-0.5">
              <span className="font-semibold text-[#2d2d2a]/70">Contrast Booster:</span>
              <span className="font-mono font-semibold text-[#5a5a40]">{contrast > 0 ? `+${contrast}` : contrast}%</span>
            </div>
            <input
              type="range"
              min="-60"
              max="60"
              value={contrast}
              onChange={(e) => setContrast(Number(e.target.value))}
              className="w-full accent-[#5a5a40] h-1"
            />
          </div>

          <div>
            <div className="flex justify-between text-[11px] mb-0.5">
              <span className="font-semibold text-[#2d2d2a]/70">Color Saturation:</span>
              <span className="font-mono font-semibold text-[#5a5a40]">{saturation > 0 ? `+${saturation}` : saturation}%</span>
            </div>
            <input
              type="range"
              min="-60"
              max="60"
              value={saturation}
              onChange={(e) => setSaturation(Number(e.target.value))}
              className="w-full accent-[#5a5a40] h-1"
            />
          </div>
        </div>
      </div>

      {/* Generation & Error Status */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 text-xs p-3 rounded-lg flex items-start gap-2">
          <ShieldAlert className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      <button
        type="button"
        disabled={isLoading || !activeSrc}
        onClick={handleGenerateClick}
        className="w-full bg-[#5a5a40] hover:bg-[#4a4a30] active:bg-[#5a5a40] disabled:bg-[#f5f5f0] disabled:text-[#2d2d2a]/30 border border-[#e2e2d8] font-semibold text-xs py-3 rounded-xl flex items-center justify-center gap-2 transition text-white shadow-sm"
      >
        {isLoading ? (
          <>
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Embroidery Stitching in progress...</span>
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4" />
            <span>Generate Beadwork Grid Pattern</span>
          </>
        )}
      </button>

    </div>
  );
}
