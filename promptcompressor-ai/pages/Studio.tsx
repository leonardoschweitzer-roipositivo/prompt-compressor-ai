import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../services/supabase';
import { Card, CardContent, Button, Textarea, Badge } from '../components/atoms/UI';
import { PromptResult } from '../types';
import { Sparkles, Copy, RefreshCw, Zap, Check, FileJson, FileCode, FileText, Bot } from 'lucide-react';

interface StudioProps {
    initialPrompt?: string;
}

export const Studio: React.FC<StudioProps> = ({ initialPrompt }) => {
    const [input, setInput] = useState(initialPrompt || '');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<PromptResult | null>(null);
    const [activeTab, setActiveTab] = useState<keyof PromptResult['optimized']>('markdown');
    const [copied, setCopied] = useState(false);

    // Ref to prevent double execution or loops
    const hasAutoRunRef = useRef(false);

    const optimize = async (text: string) => {
        if (!text.trim()) return;
        setLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;
            if (!token) throw new Error('No active session');

            const response = await fetch('/api/optimize', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ prompt: text }),
            });

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(errText || 'Falha na requisição');
            }

            const data = await response.json();

            const resultData: PromptResult = {
                original: data.original_prompt,
                optimized: {
                    markdown: data.optimized_markdown || "",
                    prettyJson: data.formats?.json_pretty || "",
                    rawJson: data.formats?.json_minified || "",
                    yaml: data.formats?.yaml || "",
                    toon: data.formats?.toon || ""
                },
                stats: {
                    originalTokens: data.stats?.original_tokens || 0,
                    optimizedTokens: data.stats?.token_counts || {},
                    savings_percentage: data.stats?.savings_percentage || "0%",
                    savings_percentage_breakdown: data.stats?.savings_percentage_breakdown || {},
                    token_counts: data.stats?.token_counts || {},
                    timestamp: new Date().toISOString()
                }
            };

            setResult(resultData);
        } catch (error) {
            console.error("Failed to generate", error);
            alert("Falha ao gerar o prompt. Por favor verifique seus logs.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (initialPrompt && !hasAutoRunRef.current) {
            hasAutoRunRef.current = true;
            setInput(initialPrompt);
            optimize(initialPrompt);
        }
    }, [initialPrompt]);

    const handleOptimize = () => optimize(input);

    const copyToClipboard = () => {
        if (!result) return;
        const content = activeTab === 'markdown'
            ? result.optimized.markdown
            : result.optimized[activeTab];

        navigator.clipboard.writeText(content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // Helper to get nested stats safe
    const getStats = (tab: string) => {
        if (!result?.stats) return { tokens: 0, saved: "0%" };

        const tokens = result.stats.token_counts?.[tab] || 0;
        const saved = result.stats.savings_percentage_breakdown?.[tab] || "0%";

        // Fallback calculation if 0
        const content = tab === 'markdown' ? result.optimized.markdown : result.optimized[tab as keyof typeof result.optimized];
        const calculatedTokens = tokens > 0 ? tokens : Math.ceil((content || "").length / 4);

        return { tokens: calculatedTokens, saved };
    };

    const isSavingsPositive = (pctString: string) => {
        return pctString && pctString !== "0%";
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-120px)]">
            {/* Input Section */}
            <Card className="flex flex-col h-full border-slate-800 bg-surface/50 backdrop-blur-sm">
                <CardContent className="flex-1 p-6 flex flex-col space-y-4">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-slate-800 rounded-lg">
                                <FileText className="w-4 h-4 text-slate-400" />
                            </div>
                            <span className="text-sm font-medium text-slate-300">Prompt Original</span>
                        </div>
                        <Badge variant="outline">{input.length} chars</Badge>
                    </div>

                    <div className="bg-slate-900/40 border border-slate-800 rounded-lg p-3 text-xs text-slate-400 leading-relaxed">
                        <span className="text-emerald-400 font-medium mb-1 block">✨ Como funciona:</span>
                        Digite sua ideia simples (ex: "Crie um email de vendas"). Nossa IA expandirá para um <strong>Super Prompt</strong> detalhado e criará versões comprimidas para economizar tokens.
                    </div>

                    <Textarea
                        placeholder="Cole seu prompt aqui para otimizar..."
                        className="flex-1 bg-slate-900/50 border-slate-700 resize-none font-mono text-sm leading-relaxed p-4 focus:ring-primary/50"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                    />

                    <div className="flex justify-end items-center pt-2">
                        <Button
                            onClick={handleOptimize}
                            className="bg-emerald-500 hover:bg-emerald-600 text-white w-full sm:w-auto transition-all duration-300 shadow-lg shadow-emerald-500/20"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                    Otimizando...
                                </>
                            ) : (
                                <>
                                    <Zap className="mr-2 h-4 w-4" />
                                    Otimizar com IA
                                </>
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Output Section */}
            <Card className="flex flex-col h-full border-slate-800 bg-surface/50 backdrop-blur-sm relative overflow-hidden">
                {!result && !loading && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 bg-slate-900/50 z-10 backdrop-blur-[2px]">
                        <Bot className="w-12 h-12 mb-4 opacity-50" />
                        <p>O resultado da otimização aparecerá aqui</p>
                    </div>
                )}

                {loading && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 bg-slate-900/80 z-20 backdrop-blur-sm">
                        <RefreshCw className="w-10 h-10 mb-4 animate-spin text-emerald-500" />
                        <p className="animate-pulse">Processando com Gemini 2.0...</p>
                    </div>
                )}

                <div className="flex items-center border-b border-slate-800 bg-slate-900/50 px-2 overflow-x-auto">
                    <TabsTrigger value="markdown" isActive={activeTab === 'markdown'} onClick={() => setActiveTab('markdown')} icon={FileText}>Markdown</TabsTrigger>
                    <TabsTrigger value="prettyJson" isActive={activeTab === 'prettyJson'} onClick={() => setActiveTab('prettyJson')} icon={FileJson}>JSON Pretty</TabsTrigger>
                    <TabsTrigger value="rawJson" isActive={activeTab === 'rawJson'} onClick={() => setActiveTab('rawJson')} icon={FileCode}>JSON Min</TabsTrigger>
                    <TabsTrigger value="yaml" isActive={activeTab === 'yaml'} onClick={() => setActiveTab('yaml')} icon={FileCode}>YAML</TabsTrigger>
                    <TabsTrigger value="toon" isActive={activeTab === 'toon'} onClick={() => setActiveTab('toon')} icon={Bot}>TOON</TabsTrigger>
                </div>

                <CardContent className="flex-1 p-0 flex flex-col min-h-0 relative">
                    <div className="flex-1 relative overflow-hidden group">
                        <textarea
                            readOnly
                            className="w-full h-full bg-[#0d1117] text-slate-300 font-mono text-sm p-6 resize-none focus:outline-none"
                            value={result ? (activeTab === 'markdown' ? result.optimized.markdown : result.optimized[activeTab]) : ''}
                        />
                        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="secondary" size="sm" onClick={copyToClipboard}>
                                {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                            </Button>
                        </div>
                    </div>

                    {/* Stats Footer */}
                    <div className="bg-slate-900/80 border-t border-slate-800 p-3 px-6 flex justify-between items-center backdrop-blur-md">
                        <div className="flex items-center gap-4">
                            {result && (
                                <div className="flex items-center gap-3">
                                    <Badge variant="secondary" className="bg-slate-800 text-slate-300 border-0">
                                        {getStats(activeTab).tokens} tokens
                                    </Badge>
                                    <div className="flex items-center gap-1.5 text-xs font-medium">
                                        <span className="text-slate-500">Economia:</span>
                                        <span className={`${isSavingsPositive(getStats(activeTab).saved) ? 'text-emerald-400' : 'text-slate-400'}`}>
                                            {getStats(activeTab).saved}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="text-[10px] text-slate-600 font-mono uppercase tracking-wider">
                            Gemini 2.0 Flash
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

const TabsTrigger: React.FC<{
    value: string;
    isActive?: boolean;
    onClick?: () => void;
    children: React.ReactNode;
    icon: React.ElementType;
}> = ({ value, isActive, onClick, children, icon: Icon }) => (
    <button
        onClick={onClick}
        className={`
            flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all duration-200 border-b-2 whitespace-nowrap
            ${isActive
                ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }
        `}
    >
        <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-500' : 'text-slate-500'}`} />
        {children}
    </button>
);