import { GoogleGenAI, Type, Schema } from "@google/genai";
import { GameConfig } from "../types";

// Initialize the Gemini client
// API Key is injected via process.env.API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const gameConfigSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    gameType: {
      type: Type.STRING,
      enum: ['clicker', 'catcher', 'memory'],
      description: "The type of game mechanics best suited for the mood. 'clicker' for release/action, 'catcher' for focus/collection, 'memory' for calm/distraction.",
    },
    title: {
      type: Type.STRING,
      description: "A creative, mood-appropriate title for the mini-game.",
    },
    description: {
      type: Type.STRING,
      description: "A short, one-sentence description of the game's vibe.",
    },
    instructions: {
      type: Type.STRING,
      description: "Brief instructions on how to play.",
    },
    theme: {
      type: Type.OBJECT,
      properties: {
        primary: { type: Type.STRING, description: "Main UI color (Hex code)" },
        secondary: { type: Type.STRING, description: "Secondary UI color (Hex code)" },
        background: { type: Type.STRING, description: "Background color (Hex code)" },
        text: { type: Type.STRING, description: "Text color (Hex code)" },
        accent: { type: Type.STRING, description: "Accent/Highlight color (Hex code)" },
      },
      required: ['primary', 'secondary', 'background', 'text', 'accent'],
    },
    assets: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "A list of 12-20 emojis, short words, or symbols related to the mood to be used as game objects.",
    },
    parameters: {
      type: Type.OBJECT,
      properties: {
        speed: { type: Type.NUMBER, description: "Game speed factor from 1 (slow/calm) to 10 (fast/intense)." },
        difficulty: { type: Type.NUMBER, description: "Difficulty factor from 1 (easy) to 10 (hard)." },
      },
      required: ['speed', 'difficulty'],
    },
  },
  required: ['gameType', 'title', 'description', 'instructions', 'theme', 'assets', 'parameters'],
};

export const generateGameForMood = async (mood: string): Promise<GameConfig> => {
  const modelId = "gemini-2.5-flash"; // Using Flash for speed as per guidelines

  const prompt = `
    The user is feeling: "${mood}".
    Create a browser-based mini-game configuration to help them regulate this emotion.

    Strategies:
    - Anger/Frustration: High energy, fast-paced 'clicker' to release tension. Use bold colors.
    - Sadness/Depression: Gentle, slow-paced 'memory' or 'catcher' to uplift. Use soothing, warm, or bright colors.
    - Boredom: Engaging, slightly challenging 'catcher' or 'memory' with interesting/weird assets.
    - Happy/Energetic: Vibrant 'catcher' or 'clicker' to celebrate.
    - Anxiety: Very slow, rhythmic 'catcher' or 'memory' to ground the user.

    Generate the game config JSON including color palette, game title, and game assets (emojis/words).
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: gameConfigSchema,
        temperature: 0.7, // Some creativity
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");

    const config = JSON.parse(text) as GameConfig;
    return config;
  } catch (error) {
    console.error("Failed to generate game config:", error);
    // Fallback config in case of API error
    return {
      gameType: 'clicker',
      title: 'Mood Popper',
      description: 'Pop the bubbles to clear your mind.',
      instructions: 'Click the floating circles!',
      theme: {
        primary: '#3B82F6',
        secondary: '#60A5FA',
        background: '#EFF6FF',
        text: '#1E3A8A',
        accent: '#2563EB',
      },
      assets: ['✨', '💧', '☁️', '💙', '⭐'],
      parameters: { speed: 5, difficulty: 5 },
    };
  }
};