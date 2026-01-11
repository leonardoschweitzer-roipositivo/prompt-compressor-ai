import React from 'react';
import { ViewState } from '../../types';
import { LayoutDashboard, PenTool, History, Settings, Zap } from 'lucide-react';

interface SidebarProps {
    currentView: ViewState;
    onChangeView: (view: ViewState) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onChangeView }) => {
    const menuItems = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'studio', label: 'Prompt Studio', icon: PenTool },
        { id: 'history', label: 'History', icon: History },
    ];

    return (
        <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-slate-800 bg-background">
            <div className="flex h-16 items-center border-b border-slate-800 px-6">
                <Zap className="h-6 w-6 text-primary mr-2" />
                <span className="text-lg font-bold tracking-tight text-white">PromptCompressor</span>
            </div>
            
            <div className="flex flex-col gap-2 p-4">
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentView === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => onChangeView(item.id as ViewState)}
                            className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                                isActive 
                                ? 'bg-primary/10 text-primary' 
                                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                            }`}
                        >
                            <Icon size={18} />
                            {item.label}
                        </button>
                    );
                })}
            </div>

            <div className="absolute bottom-4 left-0 w-full px-4">
                <div className="rounded-lg bg-surface p-4 border border-slate-800">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white">
                            JS
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs font-medium text-white">Jane Smith</span>
                            <span className="text-[10px] text-slate-400">Pro Plan</span>
                        </div>
                    </div>
                    <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden mt-2">
                        <div className="bg-primary h-full w-[70%]" />
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 block">35k / 50k Tokens Used</span>
                </div>
            </div>
        </aside>
    );
};