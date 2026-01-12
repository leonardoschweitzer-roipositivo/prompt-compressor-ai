import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { Card, CardContent, CardHeader, CardTitle, Badge, Button, Textarea } from '../components/atoms/UI';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, BarChart, Bar } from 'recharts';
import { ArrowUpRight, ArrowDownRight, Activity, DollarSign, Database, Clock, Zap, X } from 'lucide-react';

interface DashboardProps {
    onNavigate: (view: any, data?: any) => void;
}

const COLORS = ['#6366f1', '#38bdf8', '#10b981', '#f59e0b'];

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [newPrompt, setNewPrompt] = useState("");
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                const token = session?.access_token;

                if (!token) throw new Error('No active session');

                const response = await fetch('/api/stats', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                if (!response.ok) throw new Error('Falha ao carregar estatísticas');
                const data = await response.json();
                setStats(data);
            } catch (error) {
                console.error("Erro no dashboard:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    const handleStartOptimize = () => {
        if (!newPrompt.trim()) return;
        onNavigate('studio', { prompt: newPrompt });
    };

    if (loading) return <div className="text-slate-500 p-8">Loading dashboard...</div>;
    if (loading) return <div className="text-slate-500 p-8">Carregando dashboard...</div>;

    return (
        <div className="space-y-6 relative">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-white tracking-tight">Dashboard</h1>
                <Button onClick={() => setShowModal(true)} className="bg-emerald-500 hover:bg-emerald-600 text-white">
                    <Zap className="w-4 h-4 mr-2" /> Nova Otimização
                </Button>
            </div>

            {/* KPI Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard title="Total de Prompts" value={stats?.totalPrompts || "0"} icon={Database} trend="+100%" trendUp={true} />
                <KPICard title="Economia de Tokens" value={(stats?.totalTokenSavings || 0).toLocaleString()} icon={Activity} trend="Live" trendUp={true} />
                <KPICard title="Eficácia de Compressão" value="~60%" icon={Zap} trend="+5%" trendUp={true} />
                <KPICard title="Economia Financeira" value={`$${Number(stats?.totalCostSaved || 0).toFixed(4)}`} icon={DollarSign} trend="Live" trendUp={true} />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Atividade de Uso (Últimos 7 Dias)</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={stats?.chartData || []}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Line type="monotone" dataKey="prompts" stroke="#10b981" strokeWidth={2} dot={{ r: 4, fill: '#10b981' }} activeDot={{ r: 8 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Tokens por Formato</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px] flex flex-col items-center justify-center relative">
                        <div className="w-full flex-1 min-h-0 relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={stats?.distributionData || []}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {(stats?.distributionData || []).map((entry: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }}
                                        itemStyle={{ color: '#fff' }}
                                        formatter={(value: number) => value.toLocaleString()}
                                    />
                                    <Legend
                                        verticalAlign="bottom"
                                        height={36}
                                        iconType="circle"
                                        formatter={(value) => <span className="text-slate-400 text-xs ml-1">{value}</span>}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
                                <span className="text-3xl font-bold text-white tracking-tighter">
                                    {((stats?.distributionData?.reduce((a: any, b: any) => a + b.value, 0) || 0) / 1000).toFixed(1)}k
                                </span>
                                <span className="text-[10px] uppercase tracking-widest text-slate-500 font-medium mt-1">Tokens</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Bottom Section: Recent Activity & Category Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Optimizations */}
                <Card>
                    <CardHeader>
                        <CardTitle>Otimizações Recentes</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-slate-400 uppercase border-b border-slate-700">
                                    <tr>
                                        <th className="px-4 py-3">Prompt</th>
                                        <th className="px-4 py-3">Cat.</th>
                                        <th className="px-4 py-3">Econ.</th>
                                        <th className="px-4 py-3 text-right">Hora</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {stats?.recentOptimizations?.map((item: any) => (
                                        <tr key={item.id} className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors">
                                            <td className="px-4 py-3 font-medium text-slate-300 max-w-[120px] truncate" title={item.prompt}>
                                                {item.prompt}
                                            </td>
                                            <td className="px-4 py-3">
                                                <Badge variant="secondary" className="bg-slate-800 text-xs px-1.5 py-0.5">{item.category || 'Gen'}</Badge>
                                            </td>
                                            <td className="px-4 py-3 text-emerald-400 font-medium whitespace-nowrap">
                                                {item.saved} tk
                                            </td>
                                            <td className="px-4 py-3 text-right text-slate-500 text-xs whitespace-nowrap">
                                                {new Date(item.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </td>
                                        </tr>
                                    ))}
                                    {(!stats?.recentOptimizations || stats.recentOptimizations.length === 0) && (
                                        <tr><td colSpan={4} className="text-center py-4 text-slate-500">Nenhuma atividade recente</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                {/* Category Distribution Bar Chart */}
                <Card>
                    <CardHeader>
                        <CardTitle>Otimizações por Categoria</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats?.categoryData || []} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={true} vertical={false} />
                                <XAxis type="number" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} width={80} />
                                <Tooltip
                                    cursor={{ fill: '#1e293b' }}
                                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Bar dataKey="value" fill="#38bdf8" radius={[0, 4, 4, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Optimize Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-surface border border-slate-700 rounded-xl w-full max-w-lg shadow-2xl p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-white">Iniciar Nova Otimização</h3>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                                <X size={24} />
                            </button>
                        </div>
                        <p className="text-slate-400 mb-4 text-sm">Cole seu prompt abaixo para começar a comprimir e otimizar.</p>

                        <div className="bg-slate-900/40 border border-slate-800 rounded-lg p-3 text-xs text-slate-400 leading-relaxed mb-4">
                            <span className="text-emerald-400 font-medium mb-1 block">✨ Como funciona:</span>
                            Digite sua ideia simples (ex: "Crie um email de vendas"). Nossa IA expandirá para um <strong>Super Prompt</strong> detalhado e criará versões comprimidas para economizar tokens.
                        </div>

                        <Textarea
                            placeholder="Cole seu prompt aqui..."
                            className="w-full h-32 mb-6 bg-slate-900/50 border-slate-700"
                            value={newPrompt}
                            onChange={(e) => setNewPrompt(e.target.value)}
                        />
                        <div className="flex justify-end gap-3">
                            <Button variant="ghost" onClick={() => setShowModal(false)}>Cancelar</Button>
                            <Button onClick={handleStartOptimize} className="bg-emerald-500 hover:bg-emerald-600 text-white">
                                Otimizar Agora <Zap className="w-4 h-4 ml-2" />
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const KPICard: React.FC<{
    title: string;
    value: string;
    icon: React.ElementType;
    trend: string;
    trendUp: boolean;
    isGoodDown?: boolean;
}> = ({ title, value, icon: Icon, trend, trendUp, isGoodDown = false }) => {
    const isPositive = isGoodDown ? !trendUp : trendUp;
    const TrendIcon = trendUp ? ArrowUpRight : ArrowDownRight;
    const trendColor = isPositive ? 'text-emerald-400' : 'text-rose-400';

    return (
        <Card>
            <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                    <div className="p-2 bg-slate-800 rounded-lg">
                        <Icon className="h-5 w-5 text-slate-300" />
                    </div>
                    {trend !== "Live" && (
                        <div className={`flex items-center text-xs font-medium ${trendColor} bg-slate-800/50 px-2 py-1 rounded-full`}>
                            <TrendIcon className="h-3 w-3 mr-1" />
                            {trend}
                        </div>
                    )}
                </div>
                <div>
                    <h3 className="text-slate-400 text-sm font-medium">{title}</h3>
                    <div className="text-2xl font-bold text-white mt-1">{value}</div>
                </div>
            </CardContent>
        </Card>
    );
};