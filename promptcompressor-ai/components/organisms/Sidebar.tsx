import React from 'react';
import { ViewState } from '../../types';
import { LayoutDashboard, PenTool, History, Settings, Zap, LogOut, X } from 'lucide-react';

interface SidebarProps {
    currentView: ViewState;
    onChangeView: (view: ViewState) => void;
    onLogout?: () => void;
    userEmail?: string;
    isOpen?: boolean;
    onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onChangeView, onLogout, userEmail, isOpen = false, onClose }) => {
    const menuItems = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'studio', label: 'Prompt Studio', icon: PenTool },
        { id: 'history', label: 'History', icon: History },
    ];

    const handleItemClick = (view: ViewState) => {
        onChangeView(view);
        if (onClose) onClose();
    };

    return (
        <aside
            className={`fixed left-0 top-0 z-50 h-screen w-64 border-r border-slate-800 bg-background flex flex-col transition-transform duration-300 ease-in-out md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
        >
            <div className="flex h-16 items-center border-b border-slate-800 px-6 shrink-0 justify-between">
                <div className="flex items-center">
                    <Zap className="h-6 w-6 text-primary mr-2" />
                    <span className="text-lg font-bold tracking-tight text-white">PromptCompressor</span>
                </div>
                <button onClick={onClose} className="md:hidden text-slate-400 hover:text-white">
                    <X size={20} />
                </button>
            </div>

            <div className="flex flex-col gap-2 p-4 flex-1">
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentView === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => handleItemClick(item.id as ViewState)}
                            className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${isActive
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

            <div className="p-4 mt-auto">
                <div className="rounded-lg bg-surface p-4 border border-slate-800">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white uppercase">
                            {userEmail ? userEmail.substring(0, 2) : 'ME'}
                        </div>
                        <div className="flex flex-col overflow-hidden">
                            <span className="text-xs font-medium text-white truncate" title={userEmail}>
                                {userEmail || 'User'}
                            </span>
                            <span className="text-xs text-slate-400">Free Plan</span>
                        </div>
                    </div>

                    <button
                        onClick={onLogout}
                        className="flex items-center gap-2 text-xs text-red-400 hover:text-red-300 transition-colors w-full pt-2 border-t border-slate-700/50"
                    >
                        <LogOut size={14} />
                        Sign Out
                    </button>
                </div>
            </div>
        </aside>
    );
};