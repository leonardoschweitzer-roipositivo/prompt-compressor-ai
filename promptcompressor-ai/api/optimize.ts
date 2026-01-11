export const config = {
    runtime: 'edge', // Voltamos para o Edge (mais rápido e robusto para fetch puro)
};

export default async function handler(req: Request) {
    // Tratamento de CORS (Para evitar bloqueios de navegador)
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
        const { prompt } = await req.json();
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            return new Response(JSON.stringify({ error: 'API Key ausente' }), { status: 500 });
        }

        // Instruções do Sistema (System Prompt)
        const systemInstruction = `
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

        // Chamada Direta à API (Sem biblioteca SDK)
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                systemInstruction: {
                    parts: [{ text: systemInstruction }]
                },
                contents: [{
                    parts: [{ text: `User Input: ${prompt}` }]
                }]
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Erro da API do Google:", errorText);
            throw new Error(`Erro na API do Gemini: ${response.status}`);
        }

        const data = await response.json();

        // Extrai o texto da resposta complexa do Google
        let text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

        // Limpeza de JSON (Blindagem)
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
        console.error("Erro Fatal:", e);
        return new Response(JSON.stringify({ error: e.message || 'Erro interno' }), { status: 500 });
    }
}