import { GoogleGenerativeAI } from "@google/generative-ai";

export const config = {
    runtime: 'edge',
};

export default async function handler(req: Request) {
    if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

    try {
        const body = await req.json();
        const { prompt } = body;

        // Log para vermos na Vercel o que está chegando
        console.log("Recebendo prompt:", prompt?.substring(0, 50) + "...");

        if (!process.env.GEMINI_API_KEY) {
            console.error("ERRO: API Key não encontrada");
            return new Response(JSON.stringify({ error: 'API Key não configurada no servidor' }), { status: 500 });
        }

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
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
        const response = await result.response;

        // Verifica se a IA bloqueou por segurança ou erro
        if (!response.candidates || response.candidates.length === 0) {
            console.error("Bloqueio da IA:", response.promptFeedback);
            return new Response(JSON.stringify({ error: 'A IA bloqueou este prompt (Segurança ou erro desconhecido)' }), { status: 400 });
        }

        const text = response.text().replace(/```json|```/g, '').trim();

        return new Response(text, { headers: { 'Content-Type': 'application/json' } });

    } catch (e: any) {
        console.error("Erro CRÍTICO no Backend:", e);
        // Retorna a mensagem real do erro para o front-end saber o que houve
        const errorMessage = e.message || 'Erro desconhecido no processamento';
        return new Response(JSON.stringify({ error: errorMessage }), { status: 500 });
    }
}