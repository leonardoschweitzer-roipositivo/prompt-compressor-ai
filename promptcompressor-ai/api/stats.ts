
import { createClient } from '@supabase/supabase-js';

export const config = {
    runtime: 'edge',
};

export default async function handler(req: Request) {
    if (req.method !== 'GET') {
        return new Response('Method not allowed', { status: 405 });
    }

    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 200, headers: corsHeaders });
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;

    if (!supabaseUrl || !supabaseKey) {
        return new Response(JSON.stringify({ error: 'Configuration error' }), {
            status: 500, headers: corsHeaders
        });
    }

    // const supabase = createClient(supabaseUrl, supabaseKey);

    try {
        // --- AUTH CHECK ---
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }
        const token = authHeader.replace('Bearer ', '');

        const supabaseAuth = createClient(supabaseUrl, supabaseKey);
        const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token);

        if (authError || !user) {
            return new Response(JSON.stringify({ error: 'Invalid Token' }), {
                status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Client for Data Access (RLS)
        const supabase = createClient(supabaseUrl, supabaseKey, {
            global: {
                headers: { Authorization: `Bearer ${token}` }
            }
        });
        // ------------------

        // 1. Fetch Summary Stats
        // We'll fetch all records to calculate on the fly for now (assuming < 10k records, this is acceptable for a prototype)
        // ideally we would use RPC calls or aggregate queries.
        const { data: allHistory, error } = await supabase
            .from('history')
            .select('id, created_at, tokens_original, tokens_optimized, cost_savings_usd, original_prompt, optimized_result, category')
            .eq('user_id', user.id); // Security: Filter by User

        if (error) throw error;

        const totalPrompts = allHistory.length;
        let totalTokenSavings = 0;
        let totalCostSaved = 0;
        const recentOptimizations = allHistory.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5).map(item => ({
            id: item.id,
            prompt: item.original_prompt,
            format: 'TOON', // We might need to extract this from JSON if we want accuracy, or just say 'Optimized'
            saved: item.tokens_original - item.tokens_optimized,
            time: item.created_at,
            category: item.category // Include category in recent list
        }));

        // Calculate Totals and History for Chart
        const usageByDay: Record<string, number> = {};
        const categoryCounts: Record<string, number> = {}; // New: Category Stats
        const formatDistribution: Record<string, number> = {
            'Markdown': 0,
            'JSON': 0,
            'YAML': 0,
            'TOON': 0
        };

        allHistory.forEach(item => {
            const savings = Math.max(0, item.tokens_original - item.tokens_optimized);
            totalTokenSavings += savings;
            totalCostSaved += Number(item.cost_savings_usd || 0);

            // Chart Data Grouping
            const date = new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            usageByDay[date] = (usageByDay[date] || 0) + 1;

            // Category Stats
            const cat = item.category || 'General';
            categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;

            // Distribution Stats (Aggregating generated tokens per format)
            if (item.optimized_result?.stats?.token_counts) {
                const counts = item.optimized_result.stats.token_counts;
                formatDistribution['Markdown'] += counts.markdown || 0;
                formatDistribution['JSON'] += counts.json_pretty || 0;
                formatDistribution['YAML'] += counts.yaml || 0;
                formatDistribution['TOON'] += counts.toon || 0;
            }
        });

        // Convert usageByDay to array for Recharts
        const chartData = Object.keys(usageByDay).map(day => ({
            name: day,
            prompts: usageByDay[day]
        })).slice(-7); // Last 7 days

        // Convert categoryCounts to array
        const categoryData = Object.keys(categoryCounts).map(key => ({
            name: key,
            value: categoryCounts[key]
        })).sort((a, b) => b.value - a.value); // Sort max to min

        // Convert distribution to array for PieChart
        const distributionData = Object.keys(formatDistribution).map(key => ({
            name: key,
            value: formatDistribution[key]
        }));

        return new Response(JSON.stringify({
            totalPrompts,
            totalTokenSavings,
            totalCostSaved: totalCostSaved.toFixed(4),
            recentOptimizations,
            chartData,
            distributionData,
            categoryData
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (e: any) {
        return new Response(JSON.stringify({ error: e.message }), {
            status: 500, headers: corsHeaders
        });
    }
}
