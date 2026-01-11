// Domain Entities

export enum OutputFormat {
    MARKDOWN = 'Markdown',
    PRETTY_JSON = 'Pretty JSON',
    RAW_JSON = 'Raw JSON',
    YAML = 'YAML',
    TOON = 'TOON'
}

export interface PromptResult {
    original: string;
    optimized: {
        markdown: string;
        prettyJson: string;
        rawJson: string;
        yaml: string;
        toon: string;
    };
    stats: {
        originalTokens: number;
        optimizedTokens: Record<string, number>;
        timestamp: string;
    }
}

export interface HistoryItem {
    id: string;
    date: string;
    originalSnippet: string;
    formatUsed: OutputFormat;
    savedTokens: number;
    tags: string[];
}

export interface KPIStats {
    totalGenerated: number;
    tokenSavings: number; // Percentage
    costSavings: number; // USD
    timeSaved: string; // e.g., "12h"
}

export type ViewState = 'dashboard' | 'studio' | 'history';

// Component Props
export interface IconProps {
    className?: string;
    size?: number;
}