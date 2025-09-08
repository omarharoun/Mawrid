 'use client';
 import { useEffect, useMemo, useRef, useState } from 'react';
 import ReactMarkdown from 'react-markdown';
 import remarkGfm from 'remark-gfm';
 import { Message } from './components/Message';
 import { Sources } from './components/Sources';
 import { getSuggestions, search, type SearchResponse } from '../lib/search-client';
 
 type ChatItem = { id: string; role: 'user' | 'assistant'; content: string };
 
 export default function HomePage() {
 	const [query, setQuery] = useState('');
 	const [isLoading, setIsLoading] = useState(false);
 	const [chat, setChat] = useState<ChatItem[]>([]);
 	const [result, setResult] = useState<SearchResponse | null>(null);
 	const [sugs, setSugs] = useState<string[]>([]);
 	const inputRef = useRef<HTMLInputElement | null>(null);
 
 	useEffect(() => {
 		if (query.length < 3) {
 			setSugs([]);
 			return;
 		}
 		const t = setTimeout(async () => {
 			try {
 				const list = await getSuggestions(query);
 				setSugs(list);
 			} catch {}
 		}, 200);
 		return () => clearTimeout(t);
 	}, [query]);
 
 	async function handleSubmit(q?: string) {
 		const text = (q ?? query).trim();
 		if (!text) return;
 		setIsLoading(true);
 		setSugs([]);
 		setChat((c) => [...c, { id: crypto.randomUUID(), role: 'user', content: text }]);
 		setQuery('');
 		try {
 			const res = await search(text);
 			setResult(res);
 			setChat((c) => [
 				...c,
 				{ id: crypto.randomUUID(), role: 'assistant', content: res.ai_summary || 'No summary available.' },
 			]);
 		} catch (e) {
 			setChat((c) => [...c, { id: crypto.randomUUID(), role: 'assistant', content: 'Something went wrong.' }]);
 		} finally {
 			setIsLoading(false);
 		}
 	}
 
 	const sourceItems = useMemo(() => {
 		if (!result) return [] as { title: string; url: string; domain: string }[];
 		return result.results.map((r) => ({ title: r.title, url: r.url, domain: r.domain }));
 	}, [result]);
 
	return (
		<div className="min-h-screen bg-black text-white">
			{/* Header */}
			<header className="border-b border-gray-800/50 bg-black/80 backdrop-blur-sm sticky top-0 z-50">
				<div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex items-center justify-between h-16">
						<div className="flex items-center space-x-4">
							<div className="text-xl font-semibold text-white">Perplexity</div>
							<div className="hidden sm:block text-sm text-gray-400">AI-powered search</div>
						</div>
						<div className="flex items-center space-x-4">
							<button className="text-sm text-gray-400 hover:text-white transition-colors">
								Sign in
							</button>
						</div>
					</div>
				</div>
			</header>

			{/* Main Content */}
			<main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				{/* Search Section */}
				<div className="mb-12">
					<div className="text-center mb-8">
						<h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
							Ask anything
						</h1>
						<p className="text-lg text-gray-400 max-w-2xl mx-auto">
							Get instant answers with sources from across the web
						</p>
					</div>

					{/* Search Input */}
					<div className="relative max-w-3xl mx-auto">
						<div className="relative">
							<input
								ref={inputRef}
								value={query}
								onChange={(e) => setQuery(e.target.value)}
								onKeyDown={(e) => {
									if (e.key === 'Enter') handleSubmit();
								}}
								placeholder="Ask anything..."
								className="w-full h-14 px-6 pr-16 text-lg bg-gray-900/50 border border-gray-700 rounded-2xl outline-none focus:border-white/30 focus:bg-gray-900/70 transition-all duration-200 placeholder:text-gray-500"
							/>
							<button
								onClick={() => handleSubmit()}
								disabled={isLoading || !query.trim()}
								className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white text-black rounded-xl flex items-center justify-center hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
							>
								{isLoading ? (
									<div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
								) : (
									<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
									</svg>
								)}
							</button>
						</div>

						{/* Suggestions Dropdown */}
						{!isLoading && sugs.length > 0 && (
							<div className="absolute left-0 right-0 mt-2 rounded-2xl border border-gray-700 bg-gray-900/95 backdrop-blur-sm shadow-2xl overflow-hidden animate-fade-in">
								{sugs.map((s, i) => (
									<button
										key={i}
										className="w-full text-left px-6 py-4 hover:bg-gray-800/50 transition-colors border-b border-gray-800/50 last:border-b-0"
										onClick={() => handleSubmit(s)}
									>
										<div className="flex items-center space-x-3">
											<svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
											</svg>
											<span className="text-white">{s}</span>
										</div>
									</button>
								))}
							</div>
						)}
					</div>
				</div>

				{/* Chat Section */}
				{chat.length > 0 && (
					<section className="space-y-8">
						{chat.map((m, index) => (
							<div key={m.id} className="animate-fade-in">
								<Message 
									role={m.role} 
									content={
										m.role === 'assistant' ? (
											<ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
										) : (
											m.content
										)
									} 
								/>
							</div>
						))}

						{isLoading && (
							<div className="animate-fade-in">
								<div className="max-w-3xl mr-auto rounded-2xl px-6 py-4 border border-gray-700 bg-gray-900/50">
									<div className="flex items-center space-x-3">
										<div className="w-2 h-2 bg-white rounded-full animate-pulse" />
										<div className="w-2 h-2 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
										<div className="w-2 h-2 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
										<span className="text-gray-400 ml-2">Thinking...</span>
									</div>
								</div>
							</div>
						)}

						{result && (
							<div className="animate-fade-in space-y-6">
								<Sources items={sourceItems} />
								<div className="max-w-3xl mr-auto text-sm text-gray-500 flex items-center space-x-4">
									<span>{result.total_results} results</span>
									<span>•</span>
									<span>{result.processing_time.toFixed(2)}s</span>
								</div>
							</div>
						)}
					</section>
				)}
			</main>
		</div>
	);
 }
