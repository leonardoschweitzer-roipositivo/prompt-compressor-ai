import { GoogleGenerativeAI } from "@google/generative-ai";

// ATENÇÃO: Removemos o 'runtime: edge'. 
// O Vercel agora vai usar Node.js Serverless (muito mais estável para APIs).

export default async function handler(req: Request) {
    // 1. Configuração de CORS (Para o front-end não reclamar)
    if (req.method === 'OPTIONS') {
        return new Response(null, {
            status: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
            },
        });
    }

    if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

    try {
        const body = await req.json();
        const { prompt } = body;

        // 2. Verificação da Chave
        if (!process.env.GEMINI_API_KEY) {
            console.error("ERRO CRÍTICO: Chave API ausente.");
            return new Response(JSON.stringify({ error: 'Configuração de Servidor: API Key não encontrada' }), { status: 500 });
        }

        // 3. Inicializa a Biblioteca Oficial (Ela acha a URL certa sozinha)
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        // 4. Instruções Blindadas
        const instruction = `
      You are an expert in Prompt Engineering.
      
      YOUR TASK:
      1. Analyze the user's request.
      2. Create an optimized prompt in BRAZILIAN PORTUGUESE (PT-BR).
      3. Translate technical formats (JSON/YAML) to ENGLISH.
      
      RETURN ONLY RAW JSON. NO MARKDOWN BLOCK.
      Structure:
      {
        "original_prompt": "user input",
        "optimized_markdown": "Versão detalhada em PT-BR...",
        "formats": {
          "json_pretty": "English JSON",
          "json_minified": "English minified",
          "yaml": "English YAML",
          "toon": "English TOON format"
        },
        "stats": {
          "original_tokens": 0,
          "optimized_tokens": 0,
          "savings_percentage": "0%"
        }
      }
    `;

        // 5. Gera o conteúdo
        const result = await model.generateContent([instruction, `User Input: ${prompt}`]);
        const response = await result.response;
        let text = response.text();

        // 6. Limpeza de JSON (Para evitar erros de formatação)
        text = text.replace(/```json/g, '').replace(/```/g, '');
        const firstBrace = text.indexOf('{');
        const lastBrace = text.lastIndexOf('}');

        if (firstBrace >= 0 && lastBrace > firstBrace) {
            text = text.substring(firstBrace, lastBrace + 1);
        }

        return new Response(text, {
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });

    } catch (e: any) {
        console.error("ERRO SERVIDOR:", e);
        return new Response(JSON.stringify({ error: e.message || 'Erro interno no servidor' }), { status: 500 });
    }
}