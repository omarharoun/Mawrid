import { NextResponse } from 'next/server';
import { tavily } from '@tavily/core';
import OpenAI from 'openai';

function createTavilyClient() {
    return tavily({ apiKey: process.env.TAVILY_API_KEY });
}

function createOpenAIClient() {
    return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

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

        // Search with Tavily - Enhanced for Google-like experience
        const tavilyClient = createTavilyClient();
        const searchResponse = await tavilyClient.search(query, {
            searchDepth: 'advanced',
            maxResults: Math.min(limit * 2, 20), // Get more results for better selection
            includeAnswer: true,
            includeImages: true,
            includeDomains: [],
            excludeDomains: []
        });

        // Process results with better formatting and metadata
        const results = searchResponse.results.map((result, index) => {
            const url = new URL(result.url);
            const domain = url.hostname;
            
            // Create better snippets (Google-like)
            let snippet = result.content;
            if (snippet.length > 300) {
                // Find the best part of the content that contains the query
                const queryWords = query.toLowerCase().split(' ').filter(word => word.length > 2);
                let bestMatch = 0;
                let bestIndex = 0;
                
                for (let i = 0; i < snippet.length - 100; i += 50) {
                    const chunk = snippet.substring(i, i + 200).toLowerCase();
                    const matches = queryWords.reduce((count, word) => 
                        count + (chunk.includes(word) ? 1 : 0), 0
                    );
                    if (matches > bestMatch) {
                        bestMatch = matches;
                        bestIndex = i;
                    }
                }
                
                snippet = snippet.substring(Math.max(0, bestIndex - 50), bestIndex + 200);
                if (bestIndex > 0) snippet = '...' + snippet;
                if (bestIndex + 200 < result.content.length) snippet = snippet + '...';
            } else {
                snippet = snippet.substring(0, 300);
            }

            return {
                title: result.title,
                url: result.url,
                snippet: snippet,
                content: result.content,
                score: 1 - (index * 0.05), // Better scoring
                timestamp: new Date().toISOString(),
                domain: domain,
                favicon: `https://www.google.com/s2/favicons?domain=${domain}&sz=32`,
                metadata: {
                    published_date: result.publishedDate || null,
                    language: 'en', // Default to English
                    type: 'webpage'
                }
            };
        });

        // Add answer if available
        const answer = searchResponse.answer;

        // Generate AI summary using OpenAI
        let aiSummary = '';
        try {
            const summaryPrompt = `Based on the following search results for the query "${query}", provide a comprehensive and accurate summary in markdown format. Focus on the most relevant and important information.

Search Results:
${results.map(r => `**${r.title}**\n${r.content}\nSource: ${r.url}\n`).join('\n---\n')}

Please provide a well-structured summary that answers the user's query:`;

            const openai = createOpenAIClient();
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
            answer: answer || null,
            suggestions: [],
            images: searchResponse.images || []
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
        
        if (!query || query.length < 2) {
            return NextResponse.json({ suggestions: [] });
        }

        // Generate intelligent suggestions based on the query
        const suggestions = generateSmartSuggestions(query);

        return NextResponse.json({ suggestions: suggestions.slice(0, 8) });
    } catch (error) {
        console.error('Suggestions API error:', error);
        return NextResponse.json({ suggestions: [] });
    }
}

function generateSmartSuggestions(query: string): string[] {
    const lowerQuery = query.toLowerCase();
    const words = query.split(' ').filter(w => w.length > 0);
    
    // Common question patterns
    const questionPatterns = [
        'what is', 'how to', 'why is', 'when is', 'where is', 'who is',
        'what are', 'how are', 'why are', 'when are', 'where are', 'who are',
        'what does', 'how does', 'why does', 'when does', 'where does', 'who does',
        'what can', 'how can', 'why can', 'when can', 'where can', 'who can'
    ];
    
    // Check if query starts with a question pattern
    const startsWithQuestion = questionPatterns.some(pattern => 
        lowerQuery.startsWith(pattern)
    );
    
    let suggestions: string[] = [];
    
    if (startsWithQuestion) {
        // For questions, provide related questions
        suggestions = [
            `${query} explained`,
            `${query} examples`,
            `${query} benefits`,
            `${query} alternatives`,
            `${query} tutorial`,
            `${query} guide`,
            `${query} tips`,
            `${query} best practices`
        ];
    } else if (words.length === 1) {
        // For single words, provide common completions
        suggestions = [
            `${query} definition`,
            `${query} meaning`,
            `${query} examples`,
            `${query} tutorial`,
            `${query} guide`,
            `${query} benefits`,
            `${query} vs alternatives`,
            `how to use ${query}`,
            `what is ${query}`,
            `${query} best practices`
        ];
    } else {
        // For multi-word queries, provide variations
        suggestions = [
            `${query} tutorial`,
            `${query} guide`,
            `${query} examples`,
            `${query} benefits`,
            `${query} alternatives`,
            `${query} comparison`,
            `${query} review`,
            `${query} tips`,
            `best ${query}`,
            `how to ${query}`,
            `what is ${query}`,
            `${query} for beginners`
        ];
    }
    
    // Add trending/popular completions based on query type
    if (lowerQuery.includes('ai') || lowerQuery.includes('artificial intelligence')) {
        suggestions.unshift(`${query} applications`, `${query} future`, `${query} ethics`);
    } else if (lowerQuery.includes('programming') || lowerQuery.includes('code')) {
        suggestions.unshift(`${query} languages`, `${query} frameworks`, `${query} tools`);
    } else if (lowerQuery.includes('business') || lowerQuery.includes('marketing')) {
        suggestions.unshift(`${query} strategy`, `${query} trends`, `${query} tools`);
    } else if (lowerQuery.includes('health') || lowerQuery.includes('medical')) {
        suggestions.unshift(`${query} research`, `${query} treatment`, `${query} symptoms`);
    }
    
    // Remove duplicates and the original query
    return [...new Set(suggestions)].filter(s => s.toLowerCase() !== lowerQuery);
}

