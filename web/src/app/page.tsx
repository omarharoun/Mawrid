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
 		<main className="min-h-dvh flex flex-col items-center p-4 sm:p-6">
 			<header className="w-full max-w-4xl flex items-center justify-between py-4">
 				<div className="text-lg text-neutral-300">Replica</div>
 				<div className="text-sm text-neutral-500">Perplexity-style UI</div>
 			</header>
 
 			<div className="w-full max-w-3xl mt-4">
 				<div className="sticky top-0 z-10">
 					<div className="relative">
 						<input
 							ref={inputRef}
 							value={query}
 							onChange={(e) => setQuery(e.target.value)}
 							onKeyDown={(e) => {
 								if (e.key === 'Enter') handleSubmit();
 							}}
 							placeholder="Ask anything..."
 							className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 outline-none focus:ring-2 focus:ring-white/20"
 						/>
 						{!isLoading && sugs.length > 0 && (
 							<div className="absolute left-0 right-0 mt-2 rounded-xl border border-white/10 bg-black/80 backdrop-blur p-2 shadow-xl">
 								{sugs.map((s, i) => (
 									<button key={i} className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/5" onClick={() => handleSubmit(s)}>
 										{s}
 									</button>
 								))}
 							</div>
 						)}
 					</div>
 				</div>
 			</div>
 
 			<section className="w-full max-w-4xl mt-8 space-y-4">
 				{chat.map((m) => (
 					<Message key={m.id} role={m.role} content={
 						m.role === 'assistant' ? (
 							<ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
 						) : (
 							m.content
 						)
 					} />
 				))}
 
 				{isLoading && (
 					<div className="max-w-3xl mr-auto rounded-2xl px-4 py-3 border border-white/10 bg-white/5 text-sm text-neutral-400">
 						Thinking...
 					</div>
 				)}
 
 				{result && (
 					<div className="space-y-4">
 						<Sources items={sourceItems} />
 						<div className="max-w-3xl mr-auto text-xs text-neutral-500">
 							{result.total_results} results • {result.processing_time.toFixed(2)}s
 						</div>
 					</div>
 				)}
 			</section>
 		</main>
 	);
 }
