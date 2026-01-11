import { GoogleGenerativeAI } from "@google/generative-ai";

export const config = {
    runtime: 'edge',
};

export default async function handler(req: Request) {
    if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

    try {
        const body = await req.json();
        const { prompt } = body;

        // Log para depuração
        console.log("Processando prompt:", prompt?.substring(0, 50) + "...");

        if (!process.env.GEMINI_API_KEY) {
            return new Response(JSON.stringify({ error: 'API Key não configurada' }), { status: 500 });
        }

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        // --- AQUI ESTÁ A MUDANÇA NAS REGRAS DE IDIOMA ---
        const instruction = `
      Você é um especialista em Prompt Engineering e Otimização de Tokens.
      
      DIRETRIZES DE IDIOMA (IMPORTANTE):
      1. O campo "optimized_markdown" DEVE ser escrito inteiramente em PORTUGUÊS DO BRASIL (PT-BR).
      2. Os campos dentro de "formats" (json, yaml, toon) DEVEM ser mantidos em INGLÊS (English), pois tokens em inglês são mais eficientes para compressores e máquinas.
      
      Sua tarefa:
      Receba o prompt do usuário e retorne APENAS um JSON válido (sem blocos de código markdown em volta) com a seguinte estrutura exata:
      {
        "original_prompt": "o prompt original do usuario",
        "optimized_markdown": "Versão Expert do prompt em PT-BR, usando técnicas como Persona, Contexto e Chain-of-Thought",
        "formats": {
          "json_pretty": "O prompt otimizado traduzido para Inglês e formatado em JSON legível",
          "json_minified": "A versão em Inglês minificada (sem espaços) para economia máxima",
          "yaml": "A versão em Inglês formato YAML",
          "toon": "A versão em Inglês no formato TOON (compacto, ex: P:Role|T:Task)"
        },
        "stats": {
          "original_tokens": (estimativa numérica inteira),
          "optimized_tokens": (estimativa numérica inteira do json_minified),
          "savings_percentage": "XX%"
        }
      }
    `;

        const result = await model.generateContent([instruction, `Prompt do Usuário: ${prompt}`]);
        const response = await result.response;

        if (!response.candidates || response.candidates.length === 0) {
            return new Response(JSON.stringify({ error: 'Bloqueio de segurança da IA.' }), { status: 400 });
        }

        const text = response.text().replace(/```json|```/g, '').trim();

        return new Response(text, { headers: { 'Content-Type': 'application/json' } });

    } catch (e: any) {
        console.error("Erro:", e);
        return new Response(JSON.stringify({ error: e.message || 'Erro no processamento' }), { status: 500 });
    }
}