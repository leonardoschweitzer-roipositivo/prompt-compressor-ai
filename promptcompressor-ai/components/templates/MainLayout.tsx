import React from 'react';
import { Sidebar } from '../organisms/Sidebar';
import { ViewState } from '../../types';

interface MainLayoutProps {
    children: React.ReactNode;
    currentView: ViewState;
    onChangeView: (view: ViewState) => void;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children, currentView, onChangeView }) => {
    return (
        <div className="min-h-screen bg-background">
            <Sidebar currentView={currentView} onChangeView={onChangeView} />
            <main className="pl-64">
                <div className="container mx-auto p-8 max-w-7xl">
                    {children}
                </div>
            </main>
        </div>
    );
};