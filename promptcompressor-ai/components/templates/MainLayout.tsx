import React, { useState } from 'react';
import { Sidebar } from '../organisms/Sidebar';
import { ViewState } from '../../types';
import { Menu, Zap } from 'lucide-react';

interface MainLayoutProps {
    children: React.ReactNode;
    currentView: ViewState;
    onChangeView: (view: ViewState) => void;
    onLogout?: () => void;
    userEmail?: string;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children, currentView, onChangeView, onLogout, userEmail }) => {
    const [isSidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="min-h-screen bg-background text-slate-100 font-sans selection:bg-primary/30">
            {/* Mobile Header */}
            <div className="md:hidden fixed top-0 left-0 right-0 z-30 h-16 border-b border-slate-800 bg-background/80 backdrop-blur flex items-center px-4 justify-between">
                <div className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-primary" />
                    <span className="font-bold text-white tracking-tight">PromptCompressor</span>
                </div>
                <button onClick={() => setSidebarOpen(true)} className="p-2 text-slate-400 hover:text-white">
                    <Menu size={24} />
                </button>
            </div>

            {/* Sidebar */}
            <Sidebar
                currentView={currentView}
                onChangeView={onChangeView}
                onLogout={onLogout}
                userEmail={userEmail}
                isOpen={isSidebarOpen}
                onClose={() => setSidebarOpen(false)}
            />

            {/* Mobile Backdrop */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            <main className="pl-0 md:pl-64 pt-16 md:pt-0 transition-all duration-300">
                <div className="container mx-auto p-4 md:p-8 max-w-7xl">
                    {children}
                </div>
            </main>
        </div>
    );
};