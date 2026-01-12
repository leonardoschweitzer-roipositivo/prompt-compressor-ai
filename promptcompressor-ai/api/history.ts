
import { createClient } from '@supabase/supabase-js';

export const config = {
    runtime: 'edge',
};

export default async function handler(req: Request) {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 200, headers: corsHeaders });
    }

    try {
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_KEY;

        if (!supabaseUrl || !supabaseKey) {
            return new Response(JSON.stringify({ error: 'Server configuration error' }), {
                status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // --- AUTH CHECK ---
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return new Response(JSON.stringify({ error: 'Unauthorized: Missing Header' }), {
                status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }
        const token = authHeader.replace('Bearer ', '');

        // Client for Auth Check
        const supabaseAuth = createClient(supabaseUrl, supabaseKey);
        const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token);

        if (authError || !user) {
            return new Response(JSON.stringify({ error: 'Unauthorized: Invalid Token' }), {
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

        const url = new URL(req.url);

        // DELETE
        if (req.method === 'DELETE') {
            const id = url.searchParams.get('id');
            if (!id) {
                return new Response(JSON.stringify({ error: 'Missing ID' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
            }

            const { error } = await supabase
                .from('history')
                .delete()
                .eq('id', id)
                .eq('user_id', user.id); // Security: User can only delete own items

            if (error) throw error;
            return new Response(JSON.stringify({ success: true }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        if (req.method !== 'GET') return new Response('Method not allowed', { status: 405 });

        // GET
        const { data, error } = await supabase
            .from('history')
            .select('*')
            .eq('user_id', user.id) // Security: Filter by User
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) throw error;

        return new Response(JSON.stringify(data), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), {
            status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}
