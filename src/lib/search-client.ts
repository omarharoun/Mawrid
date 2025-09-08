export type SearchResult = {
    title: string;
    url: string;
    snippet: string;
    content?: string;
    score: number;
    timestamp: string;
    domain: string;
    metadata?: Record<string, unknown>;
};

export type SearchResponse = {
    query: string;
    results: SearchResult[];
    total_results: number;
    processing_time: number;
    ai_summary?: string;
    suggestions?: string[];
};

export async function search(query: string, options?: { limit?: number; offset?: number; filters?: Record<string, unknown> }) {
    const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, ...options }),
    });
    if (!response.ok) throw new Error('Search failed');
    return (await response.json()) as SearchResponse;
}

export async function getSuggestions(query: string): Promise<string[]> {
    const url = new URL('/api/search', window.location.origin);
    url.searchParams.set('query', query);
    const response = await fetch(url.toString());
    if (!response.ok) return [];
    const data = await response.json();
    return data.suggestions ?? [];
}

