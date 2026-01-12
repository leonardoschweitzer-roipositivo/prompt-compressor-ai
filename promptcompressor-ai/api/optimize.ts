import { createClient } from '@supabase/supabase-js';

export const config = {
    runtime: 'edge',
};

export default async function handler(req: Request, context: any) {
    // 1. CORS Headers
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Tratamento de Pre-flight request
    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 200, headers: corsHeaders });
    }

    if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

    try {
        const { prompt } = await req.json();

        // Pega as chaves do arquivo .env.local
        const apiKey = process.env.GEMINI_API_KEY;
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_KEY;

        if (!apiKey || !supabaseUrl || !supabaseKey) {
            return new Response(JSON.stringify({ error: 'Configuração de API incompleta' }), {
                status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // --- AUTH CHECK ---
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return new Response(JSON.stringify({ error: 'Authorization header missing' }), {
                status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const token = authHeader.replace('Bearer ', '');
        const supabaseAuth = createClient(supabaseUrl, supabaseKey);
        const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token);

        if (authError || !user) {
            return new Response(JSON.stringify({ error: 'Unauthorized: Invalid Token' }), {
                status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }
        // ------------------

        // 2. System Prompt
        // 2. System Prompt - Aggressive Compression Update
        const systemInstruction = `
      You are an elite Prompt Engineer specialized in Context Compression.
      
      YOUR GOAL:
      1. EXPAND the user's simple request into a "Super Prompt" in Markdown (High Verbosity, High Detail).
      2. COMPRESS that exact same logic into highly efficient formats for LLM consumption (Zero Information Loss, Maximum Token Savings).
      3. CATEGORIZE the prompt into one trigger tag: [Coding, Content, Business, Academic, Data, Personal].

      ---
      PHASE 1: EXPANSION (Target: optimized_markdown)
      - Language: BRAZILIAN PORTUGUESE (PT-BR).
      - Style: Authoritative, structural, and exhaustive.
      - Content: Include Role, Context, Constraints, Step-by-Step Instructions, Output Format, and Few-Shot Examples.
      - This must be the "Perfect Prompt" for clarity.

      ---
      PHASE 2: COMPRESSION (Target: formats)
      - Translate the logic from Phase 1 into English (Technical).
      - Apply "Lossless Semantic Compression" principles:
        - REMOVE: Articles (a, an, the), polite phrases, filler words, redundant adjectives.
        - SHORTEN: "Instruction" -> "Inst", "Context" -> "Ctx", "Example" -> "Ex".
        - SYNTAX: Use symbols (>, +, &, |) to replace connectors.

      SPECIFIC FORMAT RULES:
      
      1. JSON Pretty/Minified: 
         - Use short keys (e.g., "role", "task", "rules"). 
         - Structure data hierarchically.
      
      2. YAML: 
         - Use block scalars (|) for text blocks only if necessary. 
         - Prioritize nesting for context.
      
      3. TOON (Token Optimized Object Notation):
         - EXTREME COMPRESSION. This is a custom format for LLMs.
         - Syntax: "Role[Expert]>Task[Action]>Rules(NoGaps|Strict)"
         - Use arrows (->) for flow.
         - Use brackets [] for attributes.
         - Use pipe | for alternatives.
         - ELIMINATE ALL WHITESPACE not strictly necessary.
         - Example: "Role[Coder]>Lang[Py]>Task[SortList]->Eff:O(nlogn)"

      ---
      RETURN ONLY RAW JSON:
      {
        "category": "Coding",
        "original_prompt": "...",
        "optimized_markdown": "...",
        "formats": {
          "json_pretty": "...",
          "json_minified": "...",
          "yaml": "...",
          "toon": "..."
        },
        "stats": {
          "original_tokens": 0,
          "token_counts": { "markdown":0, "json_pretty":0, "json_minified":0, "yaml":0, "toon":0 }
        }
      }
    `;

        // 3. Chamada Gemini (Mantendo o modelo 2.0 Flash que funcionou para você)
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

        // ... (fetch continues) ...
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: `${systemInstruction}\n\nUser Input: ${prompt}` }]
                }],
                generationConfig: {
                    responseMimeType: "application/json"
                }
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            return new Response(JSON.stringify({ error: `Erro na IA: ${errorText}` }), {
                status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const data = await response.json();
        let text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

        // Limpeza do JSON
        text = text.replace(/```json/g, '').replace(/```/g, '');
        const firstBrace = text.indexOf('{');
        const lastBrace = text.lastIndexOf('}');

        if (firstBrace >= 0 && lastBrace > firstBrace) {
            text = text.substring(firstBrace, lastBrace + 1);
        }

        // --- PARTE NOVA: SALVAR NO SUPABASE COM WAITUNTIL ---
        if (context && context.waitUntil) {
            const supabasePromise = (async () => {
                try {
                    // Create client specifically for this user context to respect RLS for INSERT
                    const supabase = createClient(supabaseUrl, supabaseKey, {
                        global: {
                            headers: {
                                Authorization: `Bearer ${token}`,
                            },
                        },
                    });
                    let jsonResponse = JSON.parse(text);

                    // Constantes de Preço (Gemini 1.5 Flash approx)
                    // Input: $0.10 per 1M tokens
                    // Output: $0.40 per 1M tokens
                    const PRICE_PER_1M_INPUT = 0.10;

                    // Tokens do input do usuário
                    const originalInputTokens = jsonResponse.stats?.original_tokens || 0;

                    // Fallback for counts
                    const tokenCounts: { [key: string]: number } = jsonResponse.stats?.token_counts || {};

                    // Ensure we have counts. If missing, estimate.
                    // IMPORTANT: Base for comparison is now MARKDOWN (The Super Prompt)
                    const mdContent = jsonResponse.optimized_markdown || "";
                    if (!tokenCounts.markdown || tokenCounts.markdown === 0) {
                        tokenCounts.markdown = Math.ceil(mdContent.length / 4);
                    }

                    const baseTokens = tokenCounts.markdown; // This is our 100% baseline

                    // Calcula economia para cada formato EM RELAÇÃO AO MARKDOWN
                    const costs: { [key: string]: number } = {};
                    const savingsPct: { [key: string]: string } = {};

                    Object.keys(jsonResponse.formats || {}).concat(['markdown']).forEach(key => {
                        let content = "";
                        if (key === 'markdown') content = mdContent;
                        else content = jsonResponse.formats[key] || "";

                        // Estima se a IA não retornou
                        if (!tokenCounts[key]) {
                            tokenCounts[key] = Math.ceil(content.length / 4);
                        }

                        const currentTokens = tokenCounts[key];
                        // Diff = Markdown - Compressed
                        // If current is Markdown, diff is 0.
                        const diff = Math.max(0, baseTokens - currentTokens);

                        costs[key] = (diff / 1000000) * PRICE_PER_1M_INPUT;

                        const pct = baseTokens > 0 ? ((diff / baseTokens) * 100).toFixed(1) : "0";
                        savingsPct[key] = `${pct}%`;
                    });

                    // Ensure stats object exists and populate
                    if (!jsonResponse.stats) jsonResponse.stats = {};
                    jsonResponse.stats.token_counts = tokenCounts;
                    jsonResponse.stats.cost_savings_breakdown = costs;
                    jsonResponse.stats.savings_percentage_breakdown = savingsPct;

                    // Para a linha principal do banco, vamos salvar a MELHOR economia (geralmente TOON)
                    // Isso mostra o potencial máximo de economia para este prompt
                    let maxSavingsUSD = 0;
                    let bestFormat = 'markdown';
                    let bestTokens = baseTokens;

                    Object.entries(costs).forEach(([fmt, saved]) => {
                        if (saved > maxSavingsUSD) {
                            maxSavingsUSD = saved;
                            bestFormat = fmt;
                            bestTokens = tokenCounts[fmt];
                        }
                    });

                    const { error } = await supabase.from('history').insert({
                        original_prompt: prompt,
                        optimized_result: jsonResponse,
                        tokens_original: tokenCounts.markdown,
                        tokens_optimized: bestTokens,
                        user_id: user.id, // Linked to Authenticated User

                        savings_percentage: savingsPct[bestFormat] || "0%",
                        latency_ms: 0,
                        model: "gemini-2.0-flash",
                        cost_savings_usd: maxSavingsUSD,
                        category: jsonResponse.category || 'General'
                    });

                    if (error) {
                        console.error("Erro ao salvar no Supabase (Background):", error);
                    } else {
                        console.log(`Salvo no Supabase! Baseline: ${tokenCounts.markdown} tks. Best Savings (${bestFormat}): $${maxSavingsUSD.toFixed(6)}`);
                    }
                } catch (err) {
                    console.error("Erro no processamento background Supabase:", err);
                }
            })();

            context.waitUntil(supabasePromise);
        }
        // --------------------------------------

        return new Response(text, {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (e: any) {
        console.error("Erro Edge Function:", e);
        return new Response(JSON.stringify({ error: e.message || 'Erro interno' }), {
            status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
    }
}