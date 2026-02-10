import { GoogleGenAI, Type } from "@google/genai";
import { AgentDebateResult, UserProfile, Asset } from "../types";

// --- CONFIGURATION ---
const BACKEND_URL = "http://127.0.0.1:8000";
const MODEL_NAME = "gemini-3-flash-preview";

// Helper to get key for fallback mode
const getApiKey = () => {
  if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
    return process.env.API_KEY;
  }
  return null;
};

// --- AGENT DEBATE ---

export const generateAgentDebate = async (
  asset: Asset,
  amount: number,
  user: UserProfile
): Promise<AgentDebateResult> => {
  
  // 1. Try Python Backend
  try {
    const response = await fetch(`${BACKEND_URL}/debate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            asset_name: asset.name,
            asset_risk: asset.riskLevel,
            amount: amount,
            user: {
                behaviorTags: user.behaviorTags,
                emotionalScore: user.emotionalScore
            }
        })
    });
    
    if (response.ok) {
        return await response.json();
    }
  } catch (err) {
      console.warn("Backend unavailable, falling back to client-side AI.");
  }

  // 2. Fallback: Client-Side Logic
  const apiKey = getApiKey();
  if (!apiKey) {
    return {
      turns: [
        { agent: 'Optimist', message: `This ${asset.name} looks promising!` },
        { agent: 'Risk', message: `Verify your risk tolerance before spending ₹${amount}.` },
        { agent: 'Data', message: `Historical data suggests volatility in the short term.` }
      ],
      conclusion: "Simulation Mode: Backend not connected. (Run uvicorn backend.main:app)",
      verdict: 'CAUTION'
    };
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `
      User wants to invest ${amount} in ${asset.name} (${asset.riskLevel}).
      Profile: ${user.behaviorTags.join(', ')}.
      Generate a debate (Optimist, Risk, Data) and a verdict (PROCEED/CAUTION/WAIT).
    `;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.OBJECT,
            properties: {
                turns: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            agent: { type: Type.STRING },
                            message: { type: Type.STRING }
                        },
                        required: ["agent", "message"]
                    }
                },
                conclusion: { type: Type.STRING },
                verdict: { type: Type.STRING }
            }
        }
      }
    });

    return JSON.parse(response.text!) as AgentDebateResult;
  } catch (error) {
    console.error("AI Error", error);
    return {
       turns: [{ agent: 'Data', message: 'System unavailable.' }],
       conclusion: 'Error connecting to AI.',
       verdict: 'WAIT'
    };
  }
};

// --- CHAT WITH TWIN ---

export const chatWithTwin = async (
  history: {role: 'user' | 'model', text: string}[],
  user: UserProfile
): Promise<string> => {
    
    // 1. Try Python Backend
    try {
        const response = await fetch(`${BACKEND_URL}/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                history: history,
                user_name: user.name
            })
        });

        if (response.ok) {
            const data = await response.json();
            return data.text;
        }
    } catch (err) {
        console.warn("Backend unavailable, using client-side fallback.");
    }

    // 2. Fallback: Client-Side Logic
    const apiKey = getApiKey();
    if (!apiKey) return "I am your AI Assistant. (Add API Key or Start Backend!)";

    try {
      const ai = new GoogleGenAI({ apiKey });
      
      const lastMessage = history[history.length - 1];
      // Clean history for API
      let pastMessages = history.slice(0, -1).filter(h => h.role === 'user' || h.role === 'model');
      // Ensure start with user if required, though chat endpoint handles it mostly
      if (pastMessages.length > 0 && pastMessages[0].role === 'model') {
         pastMessages = pastMessages.slice(1);
      }

      const formattedHistory = pastMessages.map(h => ({
        role: h.role,
        parts: [{ text: h.text }]
      }));

      const chat = ai.chats.create({
        model: MODEL_NAME,
        config: {
            systemInstruction: `You are a helpful financial assistant for ${user.name}. Keep it simple.`,
            maxOutputTokens: 1000, 
        },
        history: formattedHistory
      });

      const response = await chat.sendMessage({
        message: lastMessage.text
      });

      return response.text || "I'm thinking...";
    } catch (e) {
      console.error("AI Chat Error", e);
      return "I'm having trouble connecting right now.";
    }
};