import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialized Gemini AI client
let aiClient: GoogleGenAI | null = null;
function getAI(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is missing");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Config endpoint to supply Google Maps API key safely to client
app.get("/api/config", (_req, res) => {
  const mapsApiKey =
    process.env.VITE_GOOGLE_MAPS_API_KEY ||
    process.env.GOOGLE_MAPS_API_KEY ||
    "AIzaSyBJIDwx3T2Np7lq5yYQgJfWQartE8FsOAQ";
  res.json({ mapsApiKey });
});

export interface LocationPin {
  id: string;
  name: string;
  lat: number;
  lng: number;
  category?: "food" | "landmark" | "museum" | "hotel" | "park" | "transit" | "shop" | "entertainment" | "other";
  address?: string;
  rating?: number;
  snippet?: string;
  realtimeInfo?: string;
}

// Multi-turn chat with Google Search grounding
app.post("/api/chat", async (req, res) => {
  try {
    const { messages, locationContext, modelName = "gemini-3.5-flash" } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "Messages array is required" });
    }

    const ai = getAI();

    const systemInstruction = `You are "MapBot", an expert geospatial local guide and real-time interactive mapping assistant.
Your goal is to answer location-specific questions, recommend venues, provide historical or cultural context, explain local transit, highlight points of interest, and give up-to-date information about places across the globe.

Current Map Viewport Context:
- Center: Latitude ${locationContext?.center?.lat ?? 37.7749}, Longitude ${locationContext?.center?.lng ?? -122.4194}
- Location Name / Label: ${locationContext?.label || "Unknown"}
- Zoom Level: ${locationContext?.zoom ?? 13}

CRITICAL RULES:
1. Always use the Google Search tool for real-time grounding (opening hours, current events, temporary closures, ticket info, weather, vibe, recent reviews).
2. When you mention, recommend, or discuss specific locations or venues, ALWAYS provide their exact coordinates in a JSON code block labeled \`\`\`json_locations at the VERY END of your message.
The format must be strictly an array of objects:
\`\`\`json_locations
[
  {
    "id": "unique-id-or-slug",
    "name": "Venue or Place Name",
    "lat": 37.7891,
    "lng": -122.4014,
    "category": "food" | "landmark" | "museum" | "hotel" | "park" | "transit" | "shop" | "entertainment" | "other",
    "address": "Street address or area",
    "rating": 4.7,
    "snippet": "1-line highlight or recommended dish/view",
    "realtimeInfo": "Open now • Closes 10 PM"
  }
]
\`\`\`
3. Keep your conversational explanations engaging, formatted with clean markdown, bullet points, and bold keywords. Never mention the raw JSON block in your prose; it will be parsed directly by the interactive map UI.
4. If the user asks about directions, suggest optimal paths, landmarks along the way, and travel modes (walking, transit, driving).`;

    // Map conversation history into Gemini format
    const contents = messages.map((m: { role: string; content: string }) => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.content }],
    }));

    // Helper function with timeout
    const fetchWithTimeout = async (fn: () => Promise<any>, ms = 8000) => {
      let timer: any;
      const timeoutPromise = new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error("Request timed out")), ms);
      });
      try {
        const res = await Promise.race([fn(), timeoutPromise]);
        clearTimeout(timer);
        return res;
      } catch (err) {
        clearTimeout(timer);
        throw err;
      }
    };

    // Generate content with Search Grounding enabled, with cascading fallback
    let response: any;
    try {
      response = await fetchWithTimeout(() =>
        ai.models.generateContent({
          model: modelName,
          contents,
          config: {
            systemInstruction,
            temperature: 0.7,
            tools: [{ googleSearch: {} }],
          },
        })
      );
    } catch (searchErr: any) {
      console.warn("Primary search model attempt failed:", searchErr.message);
      // Try gemini-3.1-flash-lite first for instant response, then gemini-3.8-flash
      try {
        response = await fetchWithTimeout(() =>
          ai.models.generateContent({
            model: "gemini-3.1-flash-lite",
            contents,
            config: {
              systemInstruction,
              temperature: 0.7,
            },
          })
        );
      } catch (fallbackErr: any) {
        console.warn("3.1-flash-lite fallback failed, trying 3.8-flash:", fallbackErr.message);
        response = await ai.models.generateContent({
          model: "gemini-3.8-flash",
          contents,
          config: {
            systemInstruction,
            temperature: 0.7,
          },
        });
      }
    }

    const fullText = response?.text || "";

    // Extract structured json_locations if present (supports array or nested object)
    let cleanText = fullText;
    let locations: LocationPin[] = [];
    const locationMatch = fullText.match(/```json_locations\s*([\s\S]*?)\s*```/);

    if (locationMatch && locationMatch[1]) {
      try {
        const parsed = JSON.parse(locationMatch[1].trim());
        let rawList: any[] = [];
        if (Array.isArray(parsed)) {
          rawList = parsed;
        } else if (parsed && typeof parsed === "object") {
          for (const key of Object.keys(parsed)) {
            if (Array.isArray(parsed[key])) {
              rawList = parsed[key];
              break;
            }
          }
        }

        locations = rawList
          .map((p: any, idx: number) => {
            const lat = typeof p.lat === "number" ? p.lat : typeof p.latitude === "number" ? p.latitude : null;
            const lng = typeof p.lng === "number" ? p.lng : typeof p.longitude === "number" ? p.longitude : typeof p.lon === "number" ? p.lon : null;
            if (lat === null || lng === null) return null;

            return {
              id: p.id || `loc-${Date.now()}-${idx}`,
              name: p.name || p.title || "Location",
              lat: Number(lat),
              lng: Number(lng),
              category: (p.category || "landmark").toLowerCase(),
              address: p.address || p.vicinity || "",
              rating: typeof p.rating === "number" ? p.rating : undefined,
              snippet: p.snippet || p.description || p.highlight || "",
              realtimeInfo: p.realtimeInfo || p.hours || "",
            } as LocationPin;
          })
          .filter(Boolean) as LocationPin[];
      } catch (err) {
        console.warn("Failed to parse json_locations block:", err);
      }
      // Remove the json block from the visible chat text
      cleanText = fullText.replace(/```json_locations\s*[\s\S]*?\s*```/, "").trim();
    }

    // Extract grounding metadata / citations
    const candidate = response.candidates?.[0];
    const groundingMetadata = candidate?.groundingMetadata;
    const searchChunks = groundingMetadata?.groundingChunks || [];
    const searchQueries = groundingMetadata?.webSearchQueries || [];

    const sources = searchChunks
      .map((chunk: any) => {
        if (chunk.web?.uri) {
          return {
            title: chunk.web.title || "Google Search Result",
            url: chunk.web.uri,
          };
        }
        return null;
      })
      .filter(Boolean);

    res.json({
      role: "model",
      content: cleanText,
      locations,
      sources,
      searchQueries,
    });
  } catch (error: any) {
    console.error("Error in /api/chat:", error);
    res.status(500).json({
      error: error.message || "An error occurred while generating response",
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
