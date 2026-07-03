import express, { Request, Response } from 'express';
import path from 'path';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini API
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (apiKey) {
  ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
} else {
  console.warn('Warning: GEMINI_API_KEY environment variable is not set. AI pattern generation will fall back to local mock generation.');
}

// System instructions for the Khatli embroidery designer
const SYSTEM_INSTRUCTION = `You are a master designer of traditional Indian hand embroidery, specializing in Khatli (Khaat), Aari, Zardosi, and Gota Patti work. 
Your task is to generate beautiful, traditional, and authentic embroidery patterns based on the user's description.

Coordinate System Guidelines:
- The design canvas is 800x800 pixels.
- The center of the canvas is (0, 0).
- All coordinates (x, y) must be relative to the center (0, 0), with values ranging from -300 to 300.
- Designs should look visually cohesive, balanced, and structurally realistic (meaning pieces don't overlap randomly).
- Necklines should form smooth curves (typically U-shaped, V-shaped, or Sweetheart).
- Butis (motifs) should be beautifully styled and clustered.
- Use traditional colors: Red (#C41E3A), Emerald Green (#006A4E), Sapphire Blue (#0F52BA), Gold/Zari (#D4AF37), Silver (#C0C0C0), and Pearl White (#FDFDFD).

Available Elements to include in your designs:
1. Mirrors (Abhala):
   - types: 'round', 'square', 'diamond', 'teardrop', 'triangle'
   - thread colors: typically matching zari (#D4AF37) or colorful silk threads
2. Kundan Stones (colored glass gems set in gold frames):
   - types: 'round', 'marquise', 'teardrop', 'square', 'oval'
   - stoneColors: 'ruby' (#C41E3A), 'emerald' (#006A4E), 'sapphire' (#0F52BA), 'pearl' (#F5F5F0), 'gold' (#D4AF37)
   - frameColor: 'gold' (#D4AF37) or 'silver' (#C0C0C0)
3. Bead Paths (strings of tiny metal beads or glass pipe beads):
   - beadTypes: 'round' (pearl/gold beads), 'gold_pipe' (cut pipes/nakshi), 'metal_ball'
   - color: 'gold' (#D4AF37), 'pearl' (#E5E4E2), 'silver' (#C0C0C0)
4. Thread Paths (stitches of metallic zari or silk threads):
   - types: 'chain' (standard outline stitch), 'zardosi' (coiled spring wire look), 'satin' (flat filling stitch)
   - color: 'gold' (#D4AF37), 'silver' (#C0C0C0), or vibrant thread colors

Symmetry Setting:
Identify the best symmetry type for the requested design:
- 'horizontal' (excellent for symmetrical necklines)
- 'vertical' (good for top-to-bottom border panels)
- 'dual' (4-way mirroring, excellent for central circular mandalas or square motifs)
- 'radial_4', 'radial_6', 'radial_8' (ideal for flower motifs, star patterns, or mandalas)
- 'none' (for asymmetrical artistic designs)

Always generate a coherent set of paths and elements. For lines or borders, make sure paths contain sequential coordinates to form smooth, flowing curves or straight lines. Since coordinates are centered, if you specify 'horizontal' symmetry, only define elements on one side (e.g. positive X) or write them symmetrically. The client application will dynamically render mirrored versions of your elements, so focus on high-quality primary segments that compile into a gorgeous composite piece.`;

// Endpoint to generate pattern via Gemini
app.post('/api/generate-pattern', async (req: Request, res: Response) => {
  const { prompt } = req.body;

  if (!prompt) {
    res.status(400).json({ error: 'Prompt is required' });
    return;
  }

  if (!ai) {
    // Return high-quality mock data if API key is missing
    console.log('Gemini API is not configured, returning elegant mock pattern.');
    res.json(getMockPattern(prompt));
    return;
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: `Design a Khatli embroidery pattern for: "${prompt}"`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: {
              type: Type.STRING,
              description: 'An elegant, traditional name for this Khatli embroidery pattern'
            },
            description: {
              type: Type.STRING,
              description: 'A detailed description of the motif, stitch styles, and materials utilized'
            },
            canvasWidth: { type: Type.INTEGER },
            canvasHeight: { type: Type.INTEGER },
            symmetry: {
              type: Type.STRING,
              description: 'Symmetry configuration: "none", "horizontal", "vertical", "dual", "radial_3", "radial_4", "radial_6", "radial_8"'
            },
            mirrors: {
              type: Type.ARRAY,
              description: 'Collection of mirror embroidery elements positioned relative to (0,0)',
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  type: { type: Type.STRING, description: '"round", "square", "diamond", "teardrop", "triangle"' },
                  x: { type: Type.NUMBER },
                  y: { type: Type.NUMBER },
                  size: { type: Type.NUMBER, description: 'Size/diameter in pixels (typically 10-30)' },
                  color: { type: Type.STRING, description: 'Hex code of the embroidery border thread wrapping the mirror' }
                },
                required: ['id', 'type', 'x', 'y', 'size', 'color']
              }
            },
            kundans: {
              type: Type.ARRAY,
              description: 'Collection of Kundan gem embellishments relative to (0,0)',
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  type: { type: Type.STRING, description: '"round", "marquise", "teardrop", "square", "oval"' },
                  x: { type: Type.NUMBER },
                  y: { type: Type.NUMBER },
                  size: { type: Type.NUMBER, description: 'Size of the stone in pixels (typically 10-25)' },
                  stoneColor: { type: Type.STRING, description: 'Hex code of the stone glass color' },
                  frameColor: { type: Type.STRING, description: 'Hex code of the metallic border casing (usually #D4AF37 for gold)' }
                },
                required: ['id', 'type', 'x', 'y', 'size', 'stoneColor', 'frameColor']
              }
            },
            beadPaths: {
              type: Type.ARRAY,
              description: 'Fine rows of stitched beads (moti) tracing lines or loops',
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  points: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        x: { type: Type.NUMBER },
                        y: { type: Type.NUMBER }
                      },
                      required: ['x', 'y']
                    }
                  },
                  beadType: { type: Type.STRING, description: '"round", "gold_pipe", "metal_ball"' },
                  size: { type: Type.NUMBER, description: 'Diameter of individual beads in pixels (typically 3-6)' },
                  color: { type: Type.STRING, description: 'Hex color of the beads' }
                },
                required: ['id', 'points', 'beadType', 'size', 'color']
              }
            },
            threadPaths: {
              type: Type.ARRAY,
              description: 'Aari, Zari, or Zardosi metallic coils/chain-stitch paths tracing shapes or lines',
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  points: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        x: { type: Type.NUMBER },
                        y: { type: Type.NUMBER }
                      },
                      required: ['x', 'y']
                    }
                  },
                  type: { type: Type.STRING, description: '"chain", "zardosi", "satin"' },
                  color: { type: Type.STRING, description: 'Hex color of the metallic or silk embroidery thread' },
                  width: { type: Type.NUMBER, description: 'Thickness of the stitch line (typically 2-6)' }
                },
                required: ['id', 'points', 'type', 'color', 'width']
              }
            }
          },
          required: ['name', 'description', 'canvasWidth', 'canvasHeight', 'symmetry', 'mirrors', 'kundans', 'beadPaths', 'threadPaths']
        }
      }
    });

    const parsedData = JSON.parse(response.text.trim());
    res.json(parsedData);
  } catch (error) {
    console.error('Gemini call failed, compiling elegant mock response:', error);
    res.status(500).json({ error: 'Failed to generate pattern. Please try again.', details: String(error) });
  }
});

// Mock generator for fallback / no key
function getMockPattern(prompt: string) {
  const lowercasePrompt = prompt.toLowerCase();
  
  if (lowercasePrompt.includes('neck') || lowercasePrompt.includes('neckline') || lowercasePrompt.includes('gala')) {
    // Generate an elegant U-neck / V-neck border
    return {
      name: "Royal Zardozi Neck Border",
      description: "An opulent U-shaped neck border blending golden Zardosi loops with alternating ruby Kundans and small teardrop mirrors. Perfect for heavy bridal wear.",
      canvasWidth: 800,
      canvasHeight: 800,
      symmetry: "horizontal",
      mirrors: [
        { id: "m1", type: "teardrop", x: 0, y: -180, size: 16, color: "#D4AF37" },
        { id: "m2", type: "round", x: 60, y: -160, size: 14, color: "#D4AF37" },
        { id: "m3", type: "round", x: 120, y: -100, size: 14, color: "#D4AF37" },
        { id: "m4", type: "teardrop", x: 160, y: -20, size: 16, color: "#D4AF37" },
        { id: "m5", type: "round", x: 180, y: 70, size: 14, color: "#D4AF37" }
      ],
      kundans: [
        { id: "k1", type: "round", x: 30, y: -175, size: 15, stoneColor: "#C41E3A", frameColor: "#D4AF37" },
        { id: "k2", type: "marquise", x: 90, y: -135, size: 18, stoneColor: "#006A4E", frameColor: "#D4AF37" },
        { id: "k3", type: "round", x: 145, y: -60, size: 15, stoneColor: "#C41E3A", frameColor: "#D4AF37" },
        { id: "k4", type: "marquise", x: 175, y: 25, size: 18, stoneColor: "#006A4E", frameColor: "#D4AF37" },
        { id: "k5", type: "round", x: 180, y: 120, size: 15, stoneColor: "#C41E3A", frameColor: "#D4AF37" }
      ],
      beadPaths: [
        {
          id: "bp1",
          points: [
            { x: 0, y: -210 },
            { x: 45, y: -195 },
            { x: 105, y: -155 },
            { x: 150, y: -95 },
            { x: 185, y: -25 },
            { x: 200, y: 50 },
            { x: 205, y: 130 }
          ],
          beadType: "round",
          size: 4,
          color: "#E5E4E2"
        },
        {
          id: "bp2",
          points: [
            { x: 0, y: -140 },
            { x: 30, y: -130 },
            { x: 70, y: -100 },
            { x: 100, y: -50 },
            { x: 120, y: 10 },
            { x: 130, y: 70 },
            { x: 130, y: 130 }
          ],
          beadType: "gold_pipe",
          size: 3,
          color: "#D4AF37"
        }
      ],
      threadPaths: [
        {
          id: "tp1",
          points: [
            { x: 0, y: -220 },
            { x: 50, y: -205 },
            { x: 115, y: -165 },
            { x: 160, y: -105 },
            { x: 195, y: -30 },
            { x: 210, y: 50 },
            { x: 215, y: 140 }
          ],
          type: "zardosi",
          color: "#D4AF37",
          width: 5
        },
        {
          id: "tp2",
          points: [
            { x: 0, y: -130 },
            { x: 25, y: -120 },
            { x: 60, y: -90 },
            { x: 90, y: -45 },
            { x: 110, y: 10 },
            { x: 115, y: 70 },
            { x: 115, y: 130 }
          ],
          type: "chain",
          color: "#C41E3A",
          width: 3
        }
      ]
    };
  } else if (lowercasePrompt.includes('flower') || lowercasePrompt.includes('mandala') || lowercasePrompt.includes('circle') || lowercasePrompt.includes('buta') || lowercasePrompt.includes('peacock')) {
    // Generate a beautiful 6-fold radial flower/mandala motif
    return {
      name: "Kutch Mirror-Work Mandala",
      description: "A rich radial motif employing 6-fold symmetry, radiating from a central round mirror. Features concentric chains of tiny gold beads, teardrop rubies, and outer marquise emeralds.",
      canvasWidth: 800,
      canvasHeight: 800,
      symmetry: "radial_6",
      mirrors: [
        { id: "m1", type: "round", x: 0, y: 0, size: 30, color: "#D4AF37" },
        { id: "m2", type: "diamond", x: 0, y: 140, size: 16, color: "#D4AF37" }
      ],
      kundans: [
        { id: "k1", type: "teardrop", x: 0, y: 65, size: 15, stoneColor: "#C41E3A", frameColor: "#D4AF37" },
        { id: "k2", type: "marquise", x: 35, y: 115, size: 16, stoneColor: "#006A4E", frameColor: "#D4AF37" }
      ],
      beadPaths: [
        {
          id: "bp1",
          points: [
            { x: -15, y: 40 },
            { x: 0, y: 45 },
            { x: 15, y: 40 }
          ],
          beadType: "round",
          size: 4,
          color: "#E5E4E2"
        },
        {
          id: "bp2",
          points: [
            { x: -35, y: 90 },
            { x: 0, y: 98 },
            { x: 35, y: 90 }
          ],
          beadType: "gold_pipe",
          size: 3,
          color: "#D4AF37"
        }
      ],
      threadPaths: [
        {
          id: "tp1",
          points: [
            { x: -25, y: 35 },
            { x: 0, y: 38 },
            { x: 25, y: 35 }
          ],
          type: "chain",
          color: "#0F52BA",
          width: 3
        },
        {
          id: "tp2",
          points: [
            { x: -50, y: 140 },
            { x: 0, y: 165 },
            { x: 50, y: 140 }
          ],
          type: "zardosi",
          color: "#D4AF37",
          width: 4
        }
      ]
    };
  } else {
    // Elegant Geometric Kutch Border / Square Frame
    return {
      name: "Symmetric Rajasthani Border Motif",
      description: "A gorgeous, heavily geometric paneled border featuring four-corner dual symmetry. Combines square mirrors framed by dense chain stitches, round beads, and metallic gold pipe rows.",
      canvasWidth: 800,
      canvasHeight: 800,
      symmetry: "dual",
      mirrors: [
        { id: "m1", type: "square", x: 0, y: 0, size: 35, color: "#C41E3A" },
        { id: "m2", type: "diamond", x: 120, y: 120, size: 20, color: "#D4AF37" },
        { id: "m3", type: "round", x: 0, y: 150, size: 16, color: "#006A4E" }
      ],
      kundans: [
        { id: "k1", type: "square", x: 120, y: 0, size: 18, stoneColor: "#0F52BA", frameColor: "#D4AF37" },
        { id: "k2", type: "teardrop", x: 0, y: 80, size: 15, stoneColor: "#C41E3A", frameColor: "#D4AF37" },
        { id: "k3", type: "marquise", x: 75, y: 75, size: 16, stoneColor: "#006A4E", frameColor: "#D4AF37" }
      ],
      beadPaths: [
        {
          id: "bp1",
          points: [
            { x: 0, y: 45 },
            { x: 45, y: 45 },
            { x: 45, y: 0 }
          ],
          beadType: "round",
          size: 4,
          color: "#E5E4E2"
        },
        {
          id: "bp2",
          points: [
            { x: 0, y: 190 },
            { x: 95, y: 190 },
            { x: 190, y: 95 },
            { x: 190, y: 0 }
          ],
          beadType: "gold_pipe",
          size: 3,
          color: "#D4AF37"
        }
      ],
      threadPaths: [
        {
          id: "tp1",
          points: [
            { x: 0, y: 55 },
            { x: 55, y: 55 },
            { x: 55, y: 0 }
          ],
          type: "chain",
          color: "#D4AF37",
          width: 3
        },
        {
          id: "tp2",
          points: [
            { x: 0, y: 210 },
            { x: 110, y: 210 },
            { x: 210, y: 110 },
            { x: 210, y: 0 }
          ],
          type: "zardosi",
          color: "#D4AF37",
          width: 5
        }
      ]
    };
  }
}

// Start Server Setup (Integrating Vite in dev, static files in prod)
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Khatli Pattern Server] Running on http://localhost:${PORT}`);
  });
}

startServer();
