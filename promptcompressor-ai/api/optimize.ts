import { GoogleGenerativeAI } from "@google/generative-ai";

export const config = {
    runtime: 'edge',
};

export default async function handler(req: Request) {
    if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

    try {
        const body = await req.json();
        const { prompt } = body;

        if (!process.env.GEMINI_API_KEY) {
            return new Response(JSON.stringify({ error: 'API Key não configurada' }), { status: 500 });
        }

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        // VERSÃO BLINDADA: Instruções em Inglês para estabilidade do JSON
        const instruction = `
      You are an expert in Prompt Engineering.
      
      YOUR TASK:
      1. Analyze the user's request.
      2. Create an optimized prompt in BRAZILIAN PORTUGUESE (PT-BR).
      3. Translate technical formats (JSON/YAML) to ENGLISH.
      
      RETURN ONLY RAW JSON. NO MARKDOWN BLOCK. NO TEXT BEFORE OR AFTER.
      Structure:
      {
        "original_prompt": "user input",
        "optimized_markdown": "Versão detalhada e otimizada EM PORTUGUÊS (PT-BR)...",
        "formats": {
          "json_pretty": "The optimized prompt TRANSLATED TO ENGLISH",
          "json_minified": "English minified version",
          "yaml": "English YAML version",
          "toon": "English TOON format"
        },
        "stats": {
          "original_tokens": 0,
          "optimized_tokens": 0,
          "savings_percentage": "0%"
        }
      }
    `;

        const result = await model.generateContent([instruction, `User Input: ${prompt}`]);
        const response = await result.response;

        // --- LIMPEZA DE SEGURANÇA (Para evitar o erro de conexão) ---
        let text = response.text();

        // 1. Remove marcadores de markdown
        text = text.replace(/```json/g, '').replace(/```/g, '');

        // 2. Encontra onde começa o JSON real e onde termina (ignora texto extra)
        const firstBrace = text.indexOf('{');
        const lastBrace = text.lastIndexOf('}');

        if (firstBrace >= 0 && lastBrace > firstBrace) {
            text = text.substring(firstBrace, lastBrace + 1);
        } else {
            throw new Error("A IA não retornou um JSON válido.");
        }

        return new Response(text, { headers: { 'Content-Type': 'application/json' } });

    } catch (e: any) {
        console.error("Erro Back-end:", e);
        return new Response(JSON.stringify({ error: e.message || 'Erro interno' }), { status: 500 });
    }
}