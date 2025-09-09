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
        const limit = parseInt(url.searchParams.get('limit') || '10');
        
        if (!query || query.length < 1) {
            return NextResponse.json({ suggestions: [] });
        }

        // Generate ultra-fast, accurate suggestions
        const suggestions = await generateUltraFastSuggestions(query, limit);

        return NextResponse.json({ suggestions });
    } catch (error) {
        console.error('Suggestions API error:', error);
        return NextResponse.json({ suggestions: [] });
    }
}


// Cached suggestions for ultra-fast response
const suggestionCache = new Map<string, string[]>();

async function generateUltraFastSuggestions(query: string, limit: number): Promise<string[]> {
    const lowerQuery = query.toLowerCase().trim();
    
    // Return cached results if available
    if (suggestionCache.has(lowerQuery)) {
        return suggestionCache.get(lowerQuery)!.slice(0, limit);
    }
    
    const suggestions: string[] = [];
    const words = lowerQuery.split(' ').filter(w => w.length > 0);
    
    // 1. Dynamic completions based on the actual query
    if (words.length === 1) {
        // Single word - generate contextual completions
        const word = words[0];
        const completions = [
            `${word} tutorial`, `${word} guide`, `${word} examples`, `${word} definition`,
            `${word} meaning`, `${word} benefits`, `${word} alternatives`, `${word} comparison`,
            `how to ${word}`, `what is ${word}`, `best ${word}`, `${word} for beginners`,
            `${word} tips`, `${word} tricks`, `${word} review`, `${word} vs`,
            `learn ${word}`, `master ${word}`, `understand ${word}`, `${word} explained`
        ];
        suggestions.push(...completions);
    } else if (words.length > 1) {
        // Multi-word - generate variations and extensions
        const baseQuery = words.join(' ');
        const variations = [
            `${baseQuery} tutorial`, `${baseQuery} guide`, `${baseQuery} examples`,
            `${baseQuery} benefits`, `${baseQuery} alternatives`, `${baseQuery} comparison`,
            `${baseQuery} review`, `${baseQuery} tips`, `${baseQuery} tricks`,
            `best ${baseQuery}`, `how to ${baseQuery}`, `what is ${baseQuery}`,
            `${baseQuery} for beginners`, `${baseQuery} explained`, `${baseQuery} vs`,
            `learn ${baseQuery}`, `master ${baseQuery}`, `understand ${baseQuery}`
        ];
        suggestions.push(...variations);
        
        // Add partial completions for each word
        for (let i = 1; i < words.length; i++) {
            const partial = words.slice(0, i).join(' ');
            suggestions.push(`${partial} tutorial`, `${partial} guide`, `${partial} examples`);
        }
    }
    
    // 2. Question pattern completions
    const questionPatterns = [
        'what is', 'how to', 'why is', 'when is', 'where is', 'who is',
        'what are', 'how are', 'why are', 'when are', 'where are', 'who are',
        'what does', 'how does', 'why does', 'when does', 'where does', 'who does',
        'what can', 'how can', 'why can', 'when can', 'where can', 'who can',
        'how much', 'how many', 'how long', 'how often', 'how far', 'how fast'
    ];
    
    for (const pattern of questionPatterns) {
        if (lowerQuery.startsWith(pattern)) {
            const remaining = lowerQuery.substring(pattern.length).trim();
            if (remaining) {
                suggestions.push(`${pattern} ${remaining} explained`);
                suggestions.push(`${pattern} ${remaining} examples`);
                suggestions.push(`${pattern} ${remaining} benefits`);
                suggestions.push(`${pattern} ${remaining} work`);
                suggestions.push(`${pattern} ${remaining} help`);
            } else {
                // Complete the question pattern
                suggestions.push(`${pattern} this`, `${pattern} that`, `${pattern} it`);
            }
        } else if (!lowerQuery.includes(pattern)) {
            // Add question patterns that could complete the query
            suggestions.push(`${pattern} ${query}`);
        }
    }
    
    // 3. Modifier completions
    const modifiers = [
        'best', 'top', 'latest', 'new', 'free', 'cheap', 'expensive',
        'easy', 'hard', 'simple', 'complex', 'quick', 'fast', 'slow',
        'good', 'bad', 'great', 'awesome', 'amazing', 'terrible', 'worst',
        'popular', 'trending', 'viral', 'famous', 'unknown', 'hidden', 'secret',
        'professional', 'beginner', 'advanced', 'expert', 'complete', 'comprehensive'
    ];
    
    for (const modifier of modifiers) {
        if (!lowerQuery.includes(modifier)) {
            suggestions.push(`${modifier} ${query}`);
        }
    }
    
    // 4. Action completions
    const actions = [
        'learn', 'study', 'practice', 'master', 'understand', 'explain',
        'build', 'create', 'make', 'develop', 'design', 'program',
        'buy', 'sell', 'rent', 'hire', 'find', 'search', 'discover',
        'compare', 'review', 'rate', 'recommend', 'suggest', 'advise',
        'download', 'install', 'setup', 'configure', 'optimize', 'improve'
    ];
    
    for (const action of actions) {
        if (!lowerQuery.includes(action)) {
            suggestions.push(`${action} ${query}`);
        }
    }
    
    // 5. Context-aware suggestions based on query content
    if (lowerQuery.includes('ai') || lowerQuery.includes('artificial') || lowerQuery.includes('machine')) {
        suggestions.push('artificial intelligence applications', 'ai ethics', 'machine learning basics', 'ai tools 2024');
    }
    if (lowerQuery.includes('programming') || lowerQuery.includes('code') || lowerQuery.includes('developer')) {
        suggestions.push('programming languages', 'coding bootcamp', 'software development', 'web development');
    }
    if (lowerQuery.includes('business') || lowerQuery.includes('marketing') || lowerQuery.includes('startup')) {
        suggestions.push('business strategy', 'digital marketing', 'entrepreneurship', 'business plan');
    }
    if (lowerQuery.includes('health') || lowerQuery.includes('medical') || lowerQuery.includes('wellness')) {
        suggestions.push('health research', 'medical treatment', 'wellness tips', 'mental health');
    }
    if (lowerQuery.includes('travel') || lowerQuery.includes('trip') || lowerQuery.includes('vacation')) {
        suggestions.push('travel planning', 'budget travel', 'travel destinations', 'travel tips');
    }
    if (lowerQuery.includes('finance') || lowerQuery.includes('money') || lowerQuery.includes('investment')) {
        suggestions.push('personal finance', 'investment strategies', 'budget planning', 'financial advice');
    }
    
    // 6. Generate completions that extend the current query
    const lastWord = words[words.length - 1];
    if (lastWord && lastWord.length > 2) {
        const extensions = [
            'tutorial', 'guide', 'examples', 'benefits', 'alternatives', 'comparison',
            'review', 'tips', 'tricks', 'explained', 'basics', 'advanced',
            'for beginners', 'vs', '2024', 'best practices', 'common mistakes'
        ];
        
        for (const ext of extensions) {
            if (!lowerQuery.includes(ext)) {
                suggestions.push(`${query} ${ext}`);
            }
        }
    }
    
    // 7. Remove duplicates, filter out the original query, and sort by relevance
    const uniqueSuggestions = [...new Set(suggestions)]
        .filter(s => s.toLowerCase() !== lowerQuery && s.toLowerCase() !== query)
        .sort((a, b) => {
            // Prioritize exact matches
            const aExact = a.toLowerCase().startsWith(lowerQuery);
            const bExact = b.toLowerCase().startsWith(lowerQuery);
            if (aExact && !bExact) return -1;
            if (!aExact && bExact) return 1;
            
            // Then by length (shorter first for better UX)
            return a.length - b.length;
        });
    
    // Cache the results for ultra-fast future responses
    suggestionCache.set(lowerQuery, uniqueSuggestions);
    
    // Limit cache size to prevent memory issues
    if (suggestionCache.size > 1000) {
        const firstKey = suggestionCache.keys().next().value;
        if (firstKey) {
            suggestionCache.delete(firstKey);
        }
    }
    
    return uniqueSuggestions.slice(0, limit);
}

