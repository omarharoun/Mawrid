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
	const [selectedSuggestion, setSelectedSuggestion] = useState(-1);
	const inputRef = useRef<HTMLInputElement | null>(null);
 
	useEffect(() => {
		if (query.length < 1) {
			setSugs([]);
			setSelectedSuggestion(-1);
			return;
		}
		
		// Ultra-fast debouncing for real-time feel
		const t = setTimeout(async () => {
			try {
				const list = await getSuggestions(query, 15); // Get more suggestions
				setSugs(list);
				setSelectedSuggestion(-1); // Reset selection when new suggestions arrive
			} catch (error) {
				console.error('Autocomplete error:', error);
				setSugs([]);
				setSelectedSuggestion(-1);
			}
		}, 50); // Ultra-fast 50ms debounce for real-time feel
		
		return () => clearTimeout(t);
	}, [query]);
 
	async function handleSubmit(q?: string) {
		const text = (q ?? query).trim();
		if (!text) return;
		setIsLoading(true);
		setSugs([]);
		setSelectedSuggestion(-1);
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

	// Handle keyboard navigation
	function handleKeyDown(e: React.KeyboardEvent) {
		if (sugs.length === 0) return;

		switch (e.key) {
			case 'ArrowDown':
				e.preventDefault();
				setSelectedSuggestion(prev => 
					prev < sugs.length - 1 ? prev + 1 : prev
				);
				break;
			case 'ArrowUp':
				e.preventDefault();
				setSelectedSuggestion(prev => prev > 0 ? prev - 1 : -1);
				break;
			case 'Enter':
				e.preventDefault();
				if (selectedSuggestion >= 0 && selectedSuggestion < sugs.length) {
					handleSubmit(sugs[selectedSuggestion]);
				} else {
					handleSubmit();
				}
				break;
			case 'Escape':
				setSugs([]);
				setSelectedSuggestion(-1);
				break;
		}
	}
 
	const sourceItems = useMemo(() => {
		if (!result) return [] as { title: string; url: string; domain: string; snippet?: string; favicon?: string; metadata?: any }[];
		return result.results.map((r) => ({ 
			title: r.title, 
			url: r.url, 
			domain: r.domain,
			snippet: r.snippet,
			favicon: r.favicon,
			metadata: r.metadata
		}));
	}, [result]);
 
	return (
		<div className="min-h-screen bg-black text-white">
			{/* Header */}
			<header className="border-b border-gray-800/50 bg-black/80 backdrop-blur-sm sticky top-0 z-50">
				<div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex items-center justify-between h-16">
						<div className="flex items-center space-x-4">
							<div className="text-xl font-semibold text-white">Marid- المورد</div>
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
					<div className="relative max-w-4xl mx-auto">
						<div className="relative">
							<div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
								<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
								</svg>
							</div>
							<input
								ref={inputRef}
								value={query}
								onChange={(e) => setQuery(e.target.value)}
								onKeyDown={handleKeyDown}
								placeholder="Search the web..."
								className="w-full h-14 pl-12 pr-16 text-lg bg-white/10 border border-gray-600 rounded-2xl outline-none focus:border-blue-500 focus:bg-white/15 transition-all duration-200 placeholder:text-gray-400 text-white backdrop-blur-sm"
								autoComplete="off"
								spellCheck="false"
							/>
							<button
								onClick={() => handleSubmit()}
								disabled={isLoading || !query.trim()}
								className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
							>
								{isLoading ? (
									<div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
								) : (
									<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
									</svg>
								)}
							</button>
						</div>

						{/* Ultra-Fast Suggestions Dropdown */}
						{!isLoading && sugs.length > 0 && (
							<div className="absolute left-0 right-0 mt-2 rounded-2xl border border-gray-600 bg-gray-900/95 backdrop-blur-sm shadow-2xl overflow-hidden animate-fade-in z-50 max-h-96 overflow-y-auto">
								<div className="px-4 py-2 text-xs text-gray-400 border-b border-gray-700">
									<span>Suggestions ({sugs.length})</span>
								</div>
								{sugs.map((s, i) => (
									<button
										key={i}
										className={`w-full text-left px-4 py-3 transition-all duration-150 border-b border-gray-800/30 last:border-b-0 group suggestion-item ${
											selectedSuggestion === i 
												? 'bg-blue-600/20 border-blue-500/30' 
												: 'hover:bg-gray-800/50'
										}`}
										onClick={() => handleSubmit(s)}
									>
										<div className="flex items-center space-x-3">
											<svg className={`w-4 h-4 transition-colors flex-shrink-0 ${
												selectedSuggestion === i 
													? 'text-blue-400' 
													: 'text-gray-500 group-hover:text-blue-400'
											}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
											</svg>
											<span className={`transition-colors text-sm leading-relaxed ${
												selectedSuggestion === i 
													? 'text-blue-300' 
													: 'text-white group-hover:text-blue-300'
											}`}>{s}</span>
											{selectedSuggestion === i && (
												<span className="ml-auto text-xs text-blue-400 bg-blue-400/10 px-2 py-1 rounded-full">
													Selected
												</span>
											)}
										</div>
									</button>
								))}
								<div className="px-4 py-2 text-xs text-gray-500 border-t border-gray-700 text-center">
									Press Enter to search or click a suggestion
								</div>
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
								{/* Direct Answer (Featured Snippet) */}
								{result.answer && (
									<div className="max-w-4xl mr-auto">
										<div className="bg-blue-900/20 border border-blue-700/50 rounded-2xl p-6">
											<div className="flex items-start space-x-3">
												<div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
													<svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
														<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
													</svg>
												</div>
												<div className="flex-1">
													<h3 className="text-lg font-semibold text-blue-300 mb-2">Quick Answer</h3>
													<div className="prose prose-invert max-w-none">
														<ReactMarkdown remarkPlugins={[remarkGfm]}>{result.answer}</ReactMarkdown>
													</div>
												</div>
											</div>
										</div>
									</div>
								)}

								{/* Images */}
								{result.images && result.images.length > 0 && (
									<div className="max-w-4xl mr-auto">
										<div className="flex items-center space-x-2 mb-4">
											<svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
											</svg>
											<h3 className="text-lg font-semibold text-gray-200">Images</h3>
										</div>
										<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
											{result.images.slice(0, 8).map((img, idx) => (
												<a
													key={idx}
													href={img.url}
													target="_blank"
													rel="noreferrer"
													className="group block rounded-xl overflow-hidden border border-gray-700 hover:border-gray-600 transition-all duration-200 hover:shadow-lg"
												>
													<div className="aspect-square bg-gray-800 relative overflow-hidden">
														<img
															src={img.url}
															alt={img.title || 'Search result image'}
															className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
															onError={(e) => {
																e.currentTarget.style.display = 'none';
																e.currentTarget.nextElementSibling?.classList.remove('hidden');
															}}
														/>
														<div className="hidden absolute inset-0 bg-gray-700 flex items-center justify-center">
															<svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
																<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
															</svg>
														</div>
													</div>
													{img.title && (
														<div className="p-2">
															<p className="text-xs text-gray-300 line-clamp-2">{img.title}</p>
														</div>
													)}
												</a>
											))}
										</div>
									</div>
								)}

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
