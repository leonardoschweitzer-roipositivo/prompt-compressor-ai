import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, Badge } from '../components/atoms/UI';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { ArrowUpRight, ArrowDownRight, Activity, DollarSign, Database, Clock } from 'lucide-react';

const mockLineData = [
  { name: 'Day 1', tokens: 4000 },
  { name: 'Day 5', tokens: 3000 },
  { name: 'Day 10', tokens: 2000 },
  { name: 'Day 15', tokens: 2780 },
  { name: 'Day 20', tokens: 1890 },
  { name: 'Day 25', tokens: 2390 },
  { name: 'Day 30', tokens: 3490 },
];

const mockPieData = [
  { name: 'Markdown', value: 400 },
  { name: 'JSON', value: 300 },
  { name: 'YAML', value: 300 },
  { name: 'TOON', value: 200 },
];

const COLORS = ['#6366f1', '#38bdf8', '#10b981', '#f59e0b'];

export const Dashboard: React.FC = () => {
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-white tracking-tight">Dashboard</h1>
            
            {/* KPI Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard title="Total Prompts" value="1,248" icon={Database} trend="+12%" trendUp={true} />
                <KPICard title="Token Savings" value="4.2M" icon={Activity} trend="+28%" trendUp={true} />
                <KPICard title="Est. Saved ($)" value="$342.50" icon={DollarSign} trend="+15%" trendUp={true} />
                <KPICard title="Avg. Latency" value="1.2s" icon={Clock} trend="-8%" trendUp={false} isGoodDown={true} />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Usage History (30 Days)</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={mockLineData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Line type="monotone" dataKey="tokens" stroke="#6366f1" strokeWidth={2} dot={{ r: 4, fill: '#6366f1' }} activeDot={{ r: 8 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Format Distribution</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px] flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={mockPieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {mockPieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', color: '#fff' }} />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute flex flex-col items-center pointer-events-none">
                            <span className="text-2xl font-bold text-white">1.2k</span>
                            <span className="text-xs text-slate-400">Total</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Activity */}
            <Card>
                <CardHeader>
                    <CardTitle>Recent Optimizations</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-slate-400 uppercase border-b border-slate-700">
                                <tr>
                                    <th className="px-4 py-3">Original Snippet</th>
                                    <th className="px-4 py-3">Format</th>
                                    <th className="px-4 py-3">Tokens Saved</th>
                                    <th className="px-4 py-3 text-right">Time</th>
                                </tr>
                            </thead>
                            <tbody>
                                {[1, 2, 3, 4, 5].map((i) => (
                                    <tr key={i} className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors">
                                        <td className="px-4 py-3 font-medium text-slate-300">
                                            Create a React component for...
                                        </td>
                                        <td className="px-4 py-3">
                                            <Badge variant={i % 2 === 0 ? 'purple' : 'success'}>
                                                {i % 2 === 0 ? 'TOON' : 'JSON'}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3 text-emerald-400 font-medium">
                                            {120 * i} tkns
                                        </td>
                                        <td className="px-4 py-3 text-right text-slate-500">
                                            {i * 10} min ago
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
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
                    <div className={`flex items-center text-xs font-medium ${trendColor} bg-slate-800/50 px-2 py-1 rounded-full`}>
                        <TrendIcon className="h-3 w-3 mr-1" />
                        {trend}
                    </div>
                </div>
                <div>
                    <h3 className="text-slate-400 text-sm font-medium">{title}</h3>
                    <div className="text-2xl font-bold text-white mt-1">{value}</div>
                </div>
            </CardContent>
        </Card>
    );
};