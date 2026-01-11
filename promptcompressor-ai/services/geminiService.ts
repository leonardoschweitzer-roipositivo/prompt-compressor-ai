import { GoogleGenAI, Type } from "@google/genai";
import { PromptResult } from "../types";

// Heuristic token estimation (approx 4 chars per token)
const estimateTokens = (text: string): number => Math.ceil(text.length / 4);

export const generateOptimizedPrompt = async (originalPrompt: string): Promise<PromptResult> => {
    if (!process.env.API_KEY) {
        throw new Error("API Key is missing");
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const systemInstruction = `
    You are an expert Prompt Engineer and Data Compressor. 
    Your goal is to take a simple user prompt, expand it into a "Super Prompt" (highly detailed, persona-based, chain-of-thought enabled), 
    and then return that same logic in multiple data serialization formats optimized for token density.
    
    1. Markdown: A beautiful, readable guide.
    2. JSON: Structured representation.
    3. YAML: Clean, whitespace sensitive.
    4. TOON (Type-Object-Object-Notation): A pseudo-format you create that is extremely dense, using pipes '|' and short keys to minimize characters while keeping semantic meaning.
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: originalPrompt,
        config: {
            systemInstruction: systemInstruction,
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    markdown: { type: Type.STRING, description: "The super prompt in Markdown format" },
                    prettyJson: { type: Type.STRING, description: "The prompt logic in verbose JSON" },
                    rawJson: { type: Type.STRING, description: "The prompt logic in minified JSON" },
                    yaml: { type: Type.STRING, description: "The prompt logic in YAML" },
                    toon: { type: Type.STRING, description: "The highly compressed TOON format" }
                },
                required: ["markdown", "prettyJson", "rawJson", "yaml", "toon"]
            }
        }
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");

    const data = JSON.parse(text);

    return {
        original: originalPrompt,
        optimized: {
            markdown: data.markdown,
            prettyJson: data.prettyJson,
            rawJson: JSON.stringify(JSON.parse(data.rawJson || data.prettyJson)), // Ensure minified
            yaml: data.yaml,
            toon: data.toon
        },
        stats: {
            originalTokens: estimateTokens(originalPrompt),
            optimizedTokens: {
                markdown: estimateTokens(data.markdown),
                prettyJson: estimateTokens(data.prettyJson),
                rawJson: estimateTokens(data.rawJson),
                yaml: estimateTokens(data.yaml),
                toon: estimateTokens(data.toon)
            },
            timestamp: new Date().toISOString()
        }
    };
};