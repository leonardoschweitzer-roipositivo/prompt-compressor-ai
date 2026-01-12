import React, { useState } from 'react';
import { supabase } from '../services/supabase';
import { Card, CardContent, CardHeader, CardTitle, Button, Input } from '../components/atoms/UI';
import { Mail, Lock, Zap, ArrowRight, Loader2 } from 'lucide-react';

export const Auth: React.FC = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (isLogin) {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
            } else {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                });
                if (error) throw error;
                alert('Success! Check your email for the confirmation link.');
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0f172a] p-4 relative overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl -translate-y-1/2 pointer-events-none" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl translate-y-1/2 pointer-events-none" />

            <Card className="w-full max-w-md border-slate-800 bg-surface/80 backdrop-blur-xl shadow-2xl relative z-10">
                <CardHeader className="text-center pb-2">
                    <div className="mx-auto bg-slate-800 w-12 h-12 rounded-xl flex items-center justify-center mb-4 shadow-inner">
                        <Zap className="w-6 h-6 text-emerald-400" />
                    </div>
                    <CardTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                        {isLogin ? 'Bem-vindo de volta' : 'Crie sua conta'}
                    </CardTitle>
                    <p className="text-slate-400 text-sm mt-2">
                        {isLogin ? 'Entre para acessar suas otimizações' : 'Comece a otimizar seus prompts hoje'}
                    </p>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleAuth} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Email</label>
                            <div className="relative group">
                                <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-500 group-focus-within:text-emerald-400 transition-colors" />
                                <Input
                                    type="email"
                                    placeholder="seu@email.com"
                                    className="pl-10 bg-slate-900/50 border-slate-700 focus:border-emerald-500/50 transition-all font-sans"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Senha</label>
                            <div className="relative group">
                                <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-500 group-focus-within:text-emerald-400 transition-colors" />
                                <Input
                                    type="password"
                                    placeholder="••••••••"
                                    className="pl-10 bg-slate-900/50 border-slate-700 focus:border-emerald-500/50 transition-all font-sans"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs">
                                {error}
                            </div>
                        )}

                        <Button
                            className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-bold h-11 transition-all shadow-lg shadow-emerald-500/20"
                            disabled={loading}
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <span className="flex items-center gap-2">
                                    {isLogin ? 'Entrar' : 'Criar Conta'} <ArrowRight className="w-4 h-4" />
                                </span>
                            )}
                        </Button>
                    </form>

                    <div className="mt-6 text-center text-sm">
                        <span className="text-slate-400">
                            {isLogin ? 'Não tem uma conta?' : 'Já tem uma conta?'}
                        </span>
                        <button
                            onClick={() => setIsLogin(!isLogin)}
                            className="ml-2 text-emerald-400 hover:text-emerald-300 font-medium transition-colors focus:outline-none"
                        >
                            {isLogin ? 'Cadastre-se' : 'Faça Login'}
                        </button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
