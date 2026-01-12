import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { Card, CardContent, CardHeader, CardTitle, Badge, Input, Button } from '../components/atoms/UI';
import { Search, Filter, Download, Eye, Copy, Trash2, X, Check } from 'lucide-react';

export const History: React.FC = () => {
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedItem, setSelectedItem] = useState<any | null>(null);
    const [copied, setCopied] = useState(false);

    // Filters
    const [selectedCategory, setSelectedCategory] = useState<string>('All');
    const [dateRange, setDateRange] = useState<string>('All');
    const [searchTerm, setSearchTerm] = useState('');

    const filteredHistory = history.filter(item => {
        const matchesSearch = item.original_prompt.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === 'All' || (item.category || 'General') === selectedCategory;
        const matchesDate = (() => {
            if (dateRange === 'All') return true;
            const itemDate = new Date(item.created_at);
            const now = new Date();
            if (dateRange === 'Today') return itemDate.toDateString() === now.toDateString();
            if (dateRange === '7days') return (now.getTime() - itemDate.getTime()) / (1000 * 3600 * 24) <= 7;
            if (dateRange === '30days') return (now.getTime() - itemDate.getTime()) / (1000 * 3600 * 24) <= 30;
            return true;
        })();
        return matchesSearch && matchesCategory && matchesDate;
    });

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;
            if (!token) throw new Error('No active session');

            const res = await fetch('/api/history', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!res.ok) throw new Error('Failed to fetch history');
            const data = await res.json();
            setHistory(data);
        } catch (error) {
            console.error("Failed to fetch history", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (!confirm('Tem certeza que deseja excluir este item?')) return;

        try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;
            if (!token) throw new Error('No active session');

            const res = await fetch(`/api/history?id=${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (res.ok) {
                setHistory(prev => prev.filter(item => item.id !== id));
                if (selectedItem?.id === id) setSelectedItem(null);
            } else {
                alert('Erro ao excluir item');
            }
        } catch (error) {
            console.error("Failed to delete", error);
        }
    };

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="space-y-6 relative">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h1 className="text-3xl font-bold text-white tracking-tight">History</h1>
                <div className="flex flex-wrap gap-2 items-center">
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                        <Input
                            placeholder="Search prompts..."
                            className="pl-9 bg-slate-900 border-slate-700 text-slate-200 placeholder:text-slate-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {/* Category Filter */}
                    <div className="relative">
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="h-10 pl-3 pr-8 rounded-md border border-slate-700 bg-slate-900 text-slate-300 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 appearance-none cursor-pointer hover:bg-slate-800"
                        >
                            <option value="All">All Categories</option>
                            <option value="Coding">Coding</option>
                            <option value="Content">Content</option>
                            <option value="Business">Business</option>
                            <option value="Academic">Academic</option>
                            <option value="Data">Data</option>
                            <option value="Personal">Personal</option>
                            <option value="General">General</option>
                        </select>
                        <Filter className="absolute right-2.5 top-3 h-4 w-4 text-slate-500 pointer-events-none" />
                    </div>

                    {/* Date Filter */}
                    <div className="relative">
                        <select
                            value={dateRange}
                            onChange={(e) => setDateRange(e.target.value)}
                            className="h-10 pl-3 pr-8 rounded-md border border-slate-700 bg-slate-900 text-slate-300 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 appearance-none cursor-pointer hover:bg-slate-800"
                        >
                            <option value="All">Any Time</option>
                            <option value="Today">Today</option>
                            <option value="7days">Last 7 Days</option>
                            <option value="30days">Last 30 Days</option>
                        </select>
                        <svg className="absolute right-2.5 top-3 h-4 w-4 text-slate-500 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    </div>

                    <button onClick={fetchHistory} className="p-2.5 border border-slate-700 rounded-md text-slate-400 hover:text-white hover:bg-slate-800" title="Refresh">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                    </button>
                    {/* <button className="p-2.5 border border-slate-700 rounded-md text-slate-400 hover:text-white hover:bg-slate-800">
                        <Download className="w-5 h-5" />
                    </button> */}
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Recent Generations (Last 50)</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center py-8 text-slate-500">Loading history...</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-slate-400 uppercase bg-slate-900/50 border-b border-slate-700">
                                    <tr>
                                        <th className="px-6 py-4">Date</th>
                                        <th className="px-6 py-4">Category</th>
                                        <th className="px-6 py-4">Prompt Snippet</th>
                                        <th className="px-6 py-4">Tokens (Orig/Opt)</th>
                                        <th className="px-6 py-4">Savings</th>
                                        <th className="px-6 py-4 text-right">Est. Cost Saved</th>
                                        <th className="px-6 py-4 text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredHistory.map((item) => (
                                        <tr key={item.id} className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors group">
                                            <td className="px-6 py-4 text-slate-400 whitespace-nowrap">
                                                {new Date(item.created_at).toLocaleDateString()} <br />
                                                <span className="text-xs opacity-50">{new Date(item.created_at).toLocaleTimeString()}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <Badge variant="secondary" className="bg-slate-800 text-slate-300 border-slate-700 text-[10px] uppercase tracking-wide">
                                                    {item.category || 'General'}
                                                </Badge>
                                            </td>
                                            <td
                                                className="px-6 py-4 max-w-xs truncate font-medium text-slate-200 cursor-pointer hover:text-primary transition-colors"
                                                title="Click to view details"
                                                onClick={() => setSelectedItem(item)}
                                            >
                                                {item.original_prompt}
                                            </td>
                                            <td className="px-6 py-4 text-slate-300">
                                                {item.tokens_original} <span className="text-slate-500">&rarr;</span> {item.tokens_optimized}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-emerald-400 font-bold">{item.savings_percentage}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right font-mono text-emerald-400">
                                                {item.cost_savings_usd !== null && item.cost_savings_usd !== undefined ? `$${Number(item.cost_savings_usd).toFixed(6)}` : '-'}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => setSelectedItem(item)}
                                                        className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-md transition-colors"
                                                        title="View Details"
                                                    >
                                                        <Eye size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleCopy(item.optimized_result?.optimized_markdown || "")}
                                                        className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-700 rounded-md transition-colors"
                                                        title="Copy Optimized Prompt"
                                                    >
                                                        {copied ? <Check size={16} /> : <Copy size={16} />}
                                                    </button>
                                                    <button
                                                        onClick={(e) => handleDelete(item.id, e)}
                                                        className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded-md transition-colors"
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {!loading && filteredHistory.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="text-center py-8 text-slate-500">
                                                No history found matching filters.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Detail Modal */}
            {selectedItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-surface border border-slate-700 rounded-xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl">
                        <div className="flex items-center justify-between p-4 border-b border-slate-700">
                            <h3 className="text-xl font-bold text-white">Prompt Details</h3>
                            <button onClick={() => setSelectedItem(null)} className="text-slate-400 hover:text-white">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
                            {/* Left Side: Original */}
                            <div className="md:w-1/3 p-4 border-r border-slate-800 flex flex-col bg-slate-900/20">
                                <h4 className="text-sm uppercase tracking-wider text-slate-500 font-semibold mb-2">Original Prompt</h4>
                                <div className="flex-1 overflow-auto bg-slate-900/50 p-4 rounded-lg border border-slate-800 text-slate-300 whitespace-pre-wrap text-sm font-mono">
                                    {selectedItem.original_prompt}
                                </div>
                                <div className="mt-2 text-xs text-slate-500">
                                    Tokens: <span className="text-slate-300">{selectedItem.tokens_original}</span>
                                </div>
                            </div>

                            {/* Right Side: Optimized with Tabs */}
                            <div className="md:w-2/3 flex flex-col bg-[#0d1117]">
                                <FormatTabs selectedItem={selectedItem} onCopy={handleCopy} copied={copied} />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const FormatTabs = ({ selectedItem, onCopy, copied }: { selectedItem: any, onCopy: (text: string) => void, copied: boolean }) => {
    const [activeTab, setActiveTab] = React.useState('markdown');

    const result = selectedItem.optimized_result || {};
    const formats = result.formats || {};
    const stats = result.stats || {};

    // Normalize data for tabs
    const tabData: any = {
        markdown: {
            content: result.optimized_markdown,
            tokens: stats.token_counts?.markdown || stats.optimized_tokens || 0,
            savings: stats.cost_savings_breakdown?.markdown || selectedItem.cost_savings_usd || 0
        },
        json_pretty: {
            content: formats.json_pretty,
            tokens: stats.token_counts?.json_pretty || 0,
            savings: stats.cost_savings_breakdown?.json_pretty || 0
        },
        json_minified: {
            content: formats.json_minified,
            tokens: stats.token_counts?.json_minified || 0,
            savings: stats.cost_savings_breakdown?.json_minified || 0
        },
        yaml: {
            content: formats.yaml,
            tokens: stats.token_counts?.yaml || 0,
            savings: stats.cost_savings_breakdown?.yaml || 0
        },
        toon: {
            content: formats.toon,
            tokens: stats.token_counts?.toon || 0,
            savings: stats.cost_savings_breakdown?.toon || 0
        }
    };

    const current = tabData[activeTab] || tabData.markdown;

    return (
        <div className="flex flex-col h-full">
            {/* Tab Header */}
            <div className="flex items-center border-b border-slate-800 bg-slate-900 overflow-x-auto">
                {Object.keys(tabData).map(key => {
                    // Only show tabs if content exists (except markdown which always exists)
                    if (key !== 'markdown' && !tabData[key].content) return null;

                    return (
                        <button
                            key={key}
                            onClick={() => setActiveTab(key)}
                            className={`px-4 py-3 text-xs font-medium border-r border-slate-800 transition-colors uppercase tracking-wider
                                ${activeTab === key ? 'bg-[#0d1117] text-emerald-400 border-b-2 border-b-emerald-400' : 'text-slate-400 hover:text-white hover:bg-slate-800'}
                            `}
                        >
                            {key.replace('_', ' ')}
                        </button>
                    );
                })}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-4 relative">
                <pre className="font-mono text-xs md:text-sm text-slate-300 whitespace-pre-wrap break-all">
                    {current.content || "No content available for this format."}
                </pre>
                <div className="absolute top-4 right-4">
                    <Button size="sm" variant="ghost" className="h-8 bg-slate-800/80 backdrop-blur hover:bg-slate-700 border border-slate-700" onClick={() => onCopy(current.content)}>
                        {copied ? <Check size={14} className="mr-1 text-emerald-400" /> : <Copy size={14} className="mr-1" />}
                        {copied ? "Copied" : "Copy"}
                    </Button>
                </div>
            </div>

            {/* Footer Stats for this tab */}
            <div className="p-3 border-t border-slate-800 bg-slate-900/50 flex justify-between items-center text-xs">
                <div className="flex gap-4 text-slate-400">
                    <span>Format: <span className="text-white capitalize">{activeTab.replace('_', ' ')}</span></span>
                    <span>Tokens: <span className="text-white font-mono">{Number(current.tokens || 0)}</span></span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-slate-500">Est. Savings:</span>
                    <span className="text-emerald-400 font-mono font-bold text-sm">
                        ${Number(current.savings || 0).toFixed(6)}
                    </span>
                </div>
            </div>
        </div>
    );
};