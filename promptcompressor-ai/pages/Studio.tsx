import React, { useState } from 'react';
import { Card, CardContent, Button, Textarea, Badge } from '../components/atoms/UI';

import { PromptResult, OutputFormat } from '../types';
import { Play, Copy, Check, FileJson, FileCode, FileType, Zap } from 'lucide-react';

export const Studio: React.FC = () => {
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<PromptResult | null>(null);
    const [activeTab, setActiveTab] = useState<keyof PromptResult['optimized']>('markdown');
    const [copied, setCopied] = useState(false);

    const handleOptimize = async () => {
        if (!input.trim()) return;
        setLoading(true);
        try {
            const response = await fetch('/api/optimize', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ prompt: input }),
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const data = await response.json();

            // Simple token estimation helper
            const estimateTokens = (text: string) => Math.ceil((text || '').length / 4);

            const resultData: PromptResult = {
                original: data.original_prompt,
                optimized: {
                    markdown: data.optimized_markdown,
                    prettyJson: data.formats.json_pretty,
                    rawJson: data.formats.json_minified,
                    yaml: data.formats.yaml,
                    toon: data.formats.toon
                },
                stats: {
                    originalTokens: Number(data.stats.original_tokens),
                    optimizedTokens: {
                        markdown: Number(data.stats.optimized_tokens),
                        prettyJson: estimateTokens(data.formats.json_pretty),
                        rawJson: estimateTokens(data.formats.json_minified),
                        yaml: estimateTokens(data.formats.yaml),
                        toon: estimateTokens(data.formats.toon)
                    },
                    timestamp: new Date().toISOString()
                }
            };

            setResult(resultData);
        } catch (error) {
            console.error("Failed to generate", error);
            alert("Failed to generate prompt. Please check your connection.");
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = () => {
        if (!result) return;
        navigator.clipboard.writeText(result.optimized[activeTab]);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-8rem)]">
            {/* Input Section */}
            <div className="flex flex-col h-full space-y-4">
                <Card className="flex-1 flex flex-col">
                    <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-surface rounded-t-xl">
                        <h2 className="font-semibold text-white flex items-center gap-2">
                            <Zap className="w-4 h-4 text-primary" />
                            Input Prompt
                        </h2>
                        <Badge variant="default">{input.length} chars</Badge>
                    </div>
                    <div className="p-4 flex-1">
                        <Textarea
                            className="h-full w-full resize-none border-0 bg-transparent focus-visible:ring-0 text-lg leading-relaxed font-mono"
                            placeholder="Describe your prompt idea here... e.g., 'Act as a Senior React Developer and review this code'"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                        />
                    </div>
                </Card>
                <Button
                    size="lg"
                    onClick={handleOptimize}
                    disabled={loading || !input}
                    className="w-full shadow-lg shadow-indigo-500/20"
                >
                    {loading ? (
                        <>
                            <span className="animate-spin mr-2">⏳</span> Optimizing...
                        </>
                    ) : (
                        <>
                            <Play className="w-4 h-4 mr-2 fill-current" /> Optimize with Gemini
                        </>
                    )}
                </Button>
            </div>

            {/* Output Section */}
            <div className="flex flex-col h-full">
                <Card className="h-full flex flex-col overflow-hidden">
                    {/* Tabs Header */}
                    <div className="flex items-center border-b border-slate-800 bg-slate-900 overflow-x-auto">
                        {Object.keys(OutputFormat).map((key) => {
                            const formatKey = key.toLowerCase().replace('_', '') as any; // simplified mapping
                            // Specific mapping for keys used in PromptResult
                            let actualKey: keyof PromptResult['optimized'] = 'markdown';
                            if (key === 'MARKDOWN') actualKey = 'markdown';
                            if (key === 'PRETTY_JSON') actualKey = 'prettyJson';
                            if (key === 'RAW_JSON') actualKey = 'rawJson';
                            if (key === 'YAML') actualKey = 'yaml';
                            if (key === 'TOON') actualKey = 'toon';

                            const label = OutputFormat[key as keyof typeof OutputFormat];
                            const isActive = activeTab === actualKey;

                            return (
                                <button
                                    key={key}
                                    onClick={() => setActiveTab(actualKey)}
                                    className={`px-4 py-3 text-sm font-medium border-r border-slate-800 transition-colors whitespace-nowrap flex items-center gap-2
                                        ${isActive ? 'bg-surface text-primary border-b-2 border-b-primary' : 'text-slate-400 hover:text-white hover:bg-slate-800'}
                                    `}
                                >
                                    {actualKey === 'markdown' && <FileCode size={14} />}
                                    {actualKey.includes('son') && <FileJson size={14} />}
                                    {actualKey === 'yaml' && <FileType size={14} />}
                                    {label}
                                </button>
                            );
                        })}
                    </div>

                    {/* Toolbar */}
                    <div className="bg-surface p-2 border-b border-slate-800 flex justify-between items-center">
                        <div className="flex gap-2">
                            {result && (
                                <>
                                    <Badge variant="purple">
                                        {result.stats.optimizedTokens[activeTab]} tokens
                                    </Badge>
                                    <span className="text-xs text-slate-500 flex items-center">
                                        Saved: <span className="text-emerald-400 ml-1 font-bold">
                                            {Math.max(0, result.stats.originalTokens - result.stats.optimizedTokens[activeTab])}
                                        </span>
                                    </span>
                                </>
                            )}
                        </div>
                        <Button variant="ghost" size="sm" onClick={copyToClipboard} disabled={!result}>
                            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                        </Button>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 overflow-auto bg-[#0d1117] p-4 relative">
                        {!result ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-500">
                                <Zap className="w-12 h-12 mb-4 opacity-20" />
                                <p>Ready to optimize your prompts.</p>
                            </div>
                        ) : (
                            <pre className="font-mono text-sm text-slate-300 whitespace-pre-wrap break-words">
                                {result.optimized[activeTab]}
                            </pre>
                        )}
                    </div>
                </Card>
            </div>
        </div>
    );
};