import { NextResponse } from 'next/server';
import { TavilySearchAPIClient } from '@tavily/core';
import OpenAI from 'openai';

const tavilyClient = new TavilySearchAPIClient(process.env.TAVILY_API_KEY);
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
    try {
        const { query, limit = 5, offset = 0 } = await request.json();
        
        if (!query || typeof query !== 'string') {
            return NextResponse.json({ detail: 'Query is required' }, { status: 400 });
        }

        if (!process.env.TAVILY_API_KEY) {
            return NextResponse.json({ detail: 'Tavily API key not configured' }, { status: 500 });
        }

        if (!process.env.OPENAI_API_KEY) {
            return NextResponse.json({ detail: 'OpenAI API key not configured' }, { status: 500 });
        }

        const startTime = Date.now();

        // Search with Tavily
        const searchResponse = await tavilyClient.search(query, {
            searchDepth: 'basic',
            maxResults: limit,
            includeAnswer: false,
            includeImages: false,
            includeDomains: [],
            excludeDomains: []
        });

        const results = searchResponse.results.map((result, index) => ({
            title: result.title,
            url: result.url,
            snippet: result.content.substring(0, 200) + '...',
            content: result.content,
            score: 1 - (index * 0.1), // Simple scoring based on position
            timestamp: new Date().toISOString(),
            domain: new URL(result.url).hostname,
            metadata: {}
        }));

        // Generate AI summary using OpenAI
        let aiSummary = '';
        try {
            const summaryPrompt = `Based on the following search results for the query "${query}", provide a comprehensive and accurate summary in markdown format. Focus on the most relevant and important information.

Search Results:
${results.map(r => `**${r.title}**\n${r.content}\nSource: ${r.url}\n`).join('\n---\n')}

Please provide a well-structured summary that answers the user's query:`;

            const completion = await openai.chat.completions.create({
                model: 'gpt-3.5-turbo',
                messages: [
                    {
                        role: 'system',
                        content: 'You are a helpful AI assistant that provides accurate, well-structured summaries based on search results. Always cite sources and provide factual information.'
                    },
                    {
                        role: 'user',
                        content: summaryPrompt
                    }
                ],
                max_tokens: 1000,
                temperature: 0.3,
            });

            aiSummary = completion.choices[0]?.message?.content || 'Unable to generate summary.';
        } catch (error) {
            console.error('Error generating AI summary:', error);
            aiSummary = 'Based on the search results, I found relevant information but was unable to generate a summary at this time.';
        }

        const processingTime = (Date.now() - startTime) / 1000;

        const response = {
            query,
            results,
            total_results: results.length,
            processing_time: processingTime,
            ai_summary: aiSummary,
            suggestions: []
        };

        return NextResponse.json(response);
    } catch (error) {
        console.error('Search API error:', error);
        return NextResponse.json({ 
            detail: 'Search failed', 
            error: error instanceof Error ? error.message : 'Unknown error' 
        }, { status: 500 });
    }
}

export async function GET(request: Request) {
    try {
        const url = new URL(request.url);
        const query = url.searchParams.get('query') || '';
        
        if (!query || query.length < 3) {
            return NextResponse.json({ suggestions: [] });
        }

        // Generate simple suggestions based on the query
        const suggestions = [
            `${query} definition`,
            `${query} examples`,
            `${query} how to`,
            `${query} benefits`,
            `${query} vs alternatives`
        ].filter(s => s !== query);

        return NextResponse.json({ suggestions: suggestions.slice(0, 5) });
    } catch (error) {
        console.error('Suggestions API error:', error);
        return NextResponse.json({ suggestions: [] });
    }
}

