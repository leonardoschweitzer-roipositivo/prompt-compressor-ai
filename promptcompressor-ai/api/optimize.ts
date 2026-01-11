import { GoogleGenerativeAI } from "@google/generative-ai";

export const config = {
    runtime: 'edge',
};

export default async function handler(req: Request) {
    if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

    try {
        const { prompt } = await req.json();
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const instruction = `
      Você é um especialista em Prompt Engineering. 
      Receba o prompt do usuário e retorne APENAS um JSON (sem markdown) com esta estrutura:
      {
        "original_prompt": "texto original",
        "optimized_markdown": "versão melhorada em markdown",
        "formats": {
          "json_pretty": "versão json legivel",
          "json_minified": "versão json minificada",
          "yaml": "versão yaml",
          "toon": "versão compacta customizada"
        },
        "stats": {
          "original_tokens": 0,
          "optimized_tokens": 0,
          "savings_percentage": "0%"
        }
      }
    `;

        const result = await model.generateContent([instruction, `Prompt: ${prompt}`]);
        const text = result.response.text().replace(/```json|```/g, '').trim();

        return new Response(text, { headers: { 'Content-Type': 'application/json' } });
    } catch (e) {
        return new Response(JSON.stringify({ error: 'Erro ao processar' }), { status: 500 });
    }
}