import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, Badge, Input } from '../components/atoms/UI';
import { Search, Filter, Download } from 'lucide-react';

export const History: React.FC = () => {
    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h1 className="text-3xl font-bold text-white tracking-tight">History</h1>
                <div className="flex gap-2">
                    <div className="relative w-64">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                        <Input placeholder="Search prompts..." className="pl-9" />
                    </div>
                    <button className="p-2 border border-slate-700 rounded-md text-slate-400 hover:text-white hover:bg-slate-800">
                        <Filter className="w-5 h-5" />
                    </button>
                    <button className="p-2 border border-slate-700 rounded-md text-slate-400 hover:text-white hover:bg-slate-800">
                        <Download className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>All Generations</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-slate-400 uppercase bg-slate-900/50 border-b border-slate-700">
                                <tr>
                                    <th className="px-6 py-4">Date</th>
                                    <th className="px-6 py-4">Prompt Snippet</th>
                                    <th className="px-6 py-4">Format</th>
                                    <th className="px-6 py-4">Savings</th>
                                    <th className="px-6 py-4">Category</th>
                                    <th className="px-6 py-4 text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {[1, 2, 3, 4, 5, 6, 7].map((item) => (
                                    <tr key={item} className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors">
                                        <td className="px-6 py-4 text-slate-400 whitespace-nowrap">
                                            Oct {10 + item}, 2023
                                        </td>
                                        <td className="px-6 py-4 max-w-xs truncate font-medium text-slate-200">
                                            Act as a senior python developer...
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge variant="purple">TOON</Badge>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <span className="text-emerald-400 font-bold">45%</span>
                                                <span className="text-slate-500 text-xs">(300 tks)</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge variant="default">Coding</Badge>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    
                    {/* Pagination Mock */}
                    <div className="flex items-center justify-end space-x-2 py-4">
                        <button className="text-xs text-slate-400 hover:text-white">Previous</button>
                        <button className="h-8 w-8 rounded-md bg-primary text-white text-xs flex items-center justify-center">1</button>
                        <button className="h-8 w-8 rounded-md border border-slate-800 text-slate-400 text-xs flex items-center justify-center hover:bg-slate-800">2</button>
                        <button className="text-xs text-slate-400 hover:text-white">Next</button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};