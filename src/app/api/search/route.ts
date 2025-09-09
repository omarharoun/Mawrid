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

// Comprehensive knowledge base for ultra-fast autocomplete
const KNOWLEDGE_BASE = {
    // Technology & Programming
    programming: [
        'javascript tutorial', 'python programming', 'react development', 'node.js backend',
        'typescript guide', 'vue.js framework', 'angular development', 'express.js server',
        'mongodb database', 'postgresql setup', 'docker containers', 'kubernetes orchestration',
        'aws cloud services', 'azure platform', 'google cloud', 'firebase hosting',
        'git version control', 'github repository', 'gitlab ci/cd', 'jenkins automation',
        'rest api design', 'graphql queries', 'microservices architecture', 'serverless functions',
        'webpack bundling', 'babel transpilation', 'eslint linting', 'prettier formatting',
        'jest testing', 'cypress e2e', 'unit testing', 'integration testing',
        'agile methodology', 'scrum framework', 'devops practices', 'ci/cd pipeline'
    ],
    
    // AI & Machine Learning
    ai: [
        'artificial intelligence', 'machine learning', 'deep learning', 'neural networks',
        'chatgpt prompts', 'openai api', 'tensorflow framework', 'pytorch library',
        'computer vision', 'natural language processing', 'nlp techniques', 'text analysis',
        'data science', 'data analysis', 'pandas library', 'numpy arrays',
        'scikit-learn', 'keras framework', 'jupyter notebooks', 'data visualization',
        'reinforcement learning', 'supervised learning', 'unsupervised learning', 'clustering algorithms',
        'regression analysis', 'classification models', 'feature engineering', 'model optimization',
        'ai ethics', 'bias in ai', 'explainable ai', 'ai safety'
    ],
    
    // Business & Marketing
    business: [
        'digital marketing', 'seo optimization', 'social media marketing', 'content marketing',
        'email marketing', 'ppc advertising', 'google ads', 'facebook marketing',
        'linkedin marketing', 'twitter strategy', 'instagram growth', 'youtube marketing',
        'ecommerce platform', 'shopify store', 'woocommerce setup', 'amazon fba',
        'dropshipping business', 'affiliate marketing', 'influencer marketing', 'brand strategy',
        'market research', 'customer analysis', 'competitor analysis', 'swot analysis',
        'business plan', 'startup funding', 'venture capital', 'angel investors',
        'project management', 'agile methodology', 'scrum master', 'product management',
        'sales funnel', 'lead generation', 'conversion optimization', 'customer retention'
    ],
    
    // Health & Wellness
    health: [
        'mental health', 'anxiety treatment', 'depression help', 'stress management',
        'meditation techniques', 'mindfulness practice', 'yoga benefits', 'exercise routine',
        'healthy diet', 'nutrition facts', 'weight loss', 'muscle building',
        'sleep hygiene', 'insomnia treatment', 'sleep disorders', 'circadian rhythm',
        'cardiovascular health', 'heart disease', 'diabetes management', 'blood pressure',
        'cancer prevention', 'cancer treatment', 'cancer research', 'oncology',
        'mental illness', 'therapy options', 'counseling services', 'psychiatric help',
        'addiction recovery', 'substance abuse', 'alcohol treatment', 'drug rehabilitation',
        'chronic pain', 'pain management', 'physical therapy', 'rehabilitation'
    ],
    
    // Education & Learning
    education: [
        'online learning', 'coursera courses', 'udemy tutorials', 'khan academy',
        'university degree', 'masters program', 'phd research', 'scholarship opportunities',
        'language learning', 'english grammar', 'spanish lessons', 'french language',
        'math tutoring', 'algebra help', 'calculus problems', 'statistics course',
        'science experiments', 'physics concepts', 'chemistry lab', 'biology study',
        'history facts', 'world history', 'american history', 'ancient civilizations',
        'literature analysis', 'poetry writing', 'creative writing', 'essay writing',
        'study techniques', 'memory improvement', 'note taking', 'exam preparation'
    ],
    
    // Travel & Lifestyle
    travel: [
        'travel planning', 'budget travel', 'backpacking tips', 'solo travel',
        'family vacation', 'honeymoon destinations', 'beach resorts', 'mountain hiking',
        'city breaks', 'cultural tourism', 'adventure travel', 'luxury travel',
        'travel insurance', 'visa requirements', 'passport renewal', 'travel documents',
        'flight booking', 'hotel reservations', 'airbnb stays', 'hostel accommodation',
        'travel photography', 'travel blogging', 'travel vlogging', 'travel writing',
        'local cuisine', 'food tourism', 'wine tasting', 'cooking classes',
        'travel safety', 'travel health', 'vaccination requirements', 'travel medicine'
    ],
    
    // Finance & Investment
    finance: [
        'personal finance', 'budget planning', 'saving money', 'debt management',
        'credit score', 'credit cards', 'loans', 'mortgage rates',
        'investment strategies', 'stock market', 'cryptocurrency', 'bitcoin trading',
        'real estate', 'property investment', 'rental income', 'house flipping',
        'retirement planning', '401k account', 'ira investment', 'pension funds',
        'tax planning', 'tax deductions', 'tax returns', 'accounting software',
        'insurance policies', 'life insurance', 'health insurance', 'car insurance',
        'financial planning', 'wealth management', 'estate planning', 'financial advisor'
    ]
};

// Popular search patterns and completions
const POPULAR_PATTERNS = {
    questions: [
        'what is', 'how to', 'why is', 'when is', 'where is', 'who is',
        'what are', 'how are', 'why are', 'when are', 'where are', 'who are',
        'what does', 'how does', 'why does', 'when does', 'where does', 'who does',
        'what can', 'how can', 'why can', 'when can', 'where can', 'who can',
        'how much', 'how many', 'how long', 'how often', 'how far', 'how fast'
    ],
    
    modifiers: [
        'best', 'top', 'latest', 'new', 'free', 'cheap', 'expensive',
        'easy', 'hard', 'simple', 'complex', 'quick', 'fast', 'slow',
        'good', 'bad', 'great', 'awesome', 'amazing', 'terrible', 'worst',
        'popular', 'trending', 'viral', 'famous', 'unknown', 'hidden', 'secret'
    ],
    
    actions: [
        'learn', 'study', 'practice', 'master', 'understand', 'explain',
        'build', 'create', 'make', 'develop', 'design', 'program',
        'buy', 'sell', 'rent', 'hire', 'find', 'search', 'discover',
        'compare', 'review', 'rate', 'recommend', 'suggest', 'advise'
    ]
};

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
    const firstWord = words[0];
    const lastWord = words[words.length - 1];
    
    // 1. Exact matches from knowledge base (highest priority)
    for (const [category, items] of Object.entries(KNOWLEDGE_BASE)) {
        for (const item of items) {
            if (item.toLowerCase().startsWith(lowerQuery)) {
                suggestions.push(item);
            }
        }
    }
    
    // 2. Partial matches from knowledge base
    for (const [category, items] of Object.entries(KNOWLEDGE_BASE)) {
        for (const item of items) {
            if (item.toLowerCase().includes(lowerQuery) && !suggestions.includes(item)) {
                suggestions.push(item);
            }
        }
    }
    
    // 3. Smart completions based on query patterns
    if (words.length === 1) {
        // Single word queries - add common completions
        const commonCompletions = [
            `${query} tutorial`, `${query} guide`, `${query} examples`, `${query} definition`,
            `${query} meaning`, `${query} benefits`, `${query} alternatives`, `${query} comparison`,
            `how to ${query}`, `what is ${query}`, `best ${query}`, `${query} for beginners`
        ];
        suggestions.push(...commonCompletions);
    } else if (words.length > 1) {
        // Multi-word queries - add variations
        const variations = [
            `${query} tutorial`, `${query} guide`, `${query} examples`, `${query} benefits`,
            `${query} alternatives`, `${query} comparison`, `${query} review`, `${query} tips`,
            `best ${query}`, `how to ${query}`, `what is ${query}`, `${query} for beginners`
        ];
        suggestions.push(...variations);
    }
    
    // 4. Question pattern completions
    const questionPatterns = POPULAR_PATTERNS.questions;
    for (const pattern of questionPatterns) {
        if (lowerQuery.startsWith(pattern)) {
            const remaining = lowerQuery.substring(pattern.length).trim();
            if (remaining) {
                suggestions.push(`${pattern} ${remaining} explained`);
                suggestions.push(`${pattern} ${remaining} examples`);
                suggestions.push(`${pattern} ${remaining} benefits`);
            }
        }
    }
    
    // 5. Modifier completions
    for (const modifier of POPULAR_PATTERNS.modifiers) {
        if (!lowerQuery.includes(modifier)) {
            suggestions.push(`${modifier} ${query}`);
        }
    }
    
    // 6. Action completions
    for (const action of POPULAR_PATTERNS.actions) {
        if (!lowerQuery.includes(action)) {
            suggestions.push(`${action} ${query}`);
        }
    }
    
    // 7. Category-specific suggestions
    if (lowerQuery.includes('ai') || lowerQuery.includes('artificial')) {
        suggestions.push('artificial intelligence applications', 'ai ethics', 'machine learning basics');
    }
    if (lowerQuery.includes('programming') || lowerQuery.includes('code')) {
        suggestions.push('programming languages', 'coding bootcamp', 'software development');
    }
    if (lowerQuery.includes('business') || lowerQuery.includes('marketing')) {
        suggestions.push('business strategy', 'digital marketing', 'entrepreneurship');
    }
    if (lowerQuery.includes('health') || lowerQuery.includes('medical')) {
        suggestions.push('health research', 'medical treatment', 'wellness tips');
    }
    
    // 8. Trending topics (simulated)
    const trendingTopics = [
        'chatgpt prompts', 'ai tools', 'remote work', 'sustainable living',
        'cryptocurrency news', 'climate change', 'mental health awareness',
        'digital nomad', 'minimalism', 'productivity tips'
    ];
    
    for (const topic of trendingTopics) {
        if (topic.toLowerCase().includes(lowerQuery) || lowerQuery.includes(topic.toLowerCase())) {
            suggestions.push(topic);
        }
    }
    
    // Remove duplicates, filter out the original query, and sort by relevance
    const uniqueSuggestions = [...new Set(suggestions)]
        .filter(s => s.toLowerCase() !== lowerQuery)
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

