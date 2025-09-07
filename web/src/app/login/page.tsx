 'use client';
 
 import { useState } from 'react';
 import { createClient } from '@/lib/supabase/client';
 import { useRouter } from 'next/navigation';
 
 export default function LoginPage() {
 	const router = useRouter();
 	const supabase = createClient();
 	const [email, setEmail] = useState('');
 	const [password, setPassword] = useState('');
 	const [loading, setLoading] = useState(false);
 	const [error, setError] = useState<string | null>(null);
 
 	async function onSubmit(e: React.FormEvent) {
 		e.preventDefault();
 		setError(null);
 		setLoading(true);
 		const { error } = await supabase.auth.signInWithPassword({ email, password });
 		setLoading(false);
 		if (error) {
 			setError(error.message);
 			return;
 		}
 		router.push('/account');
 	}
 
 	return (
 		<main className="min-h-dvh flex items-center justify-center p-6">
 			<form onSubmit={onSubmit} className="w-full max-w-sm space-y-4">
 				<h1 className="text-2xl font-semibold">Login</h1>
 				<input
 					required
 					className="w-full px-3 py-2 rounded bg-neutral-900 border border-white/10"
 					type="email"
 					placeholder="Email"
 					value={email}
 					onChange={(e) => setEmail(e.target.value)}
 				/>
 				<input
 					required
 					className="w-full px-3 py-2 rounded bg-neutral-900 border border-white/10"
 					type="password"
 					placeholder="Password"
 					value={password}
 					onChange={(e) => setPassword(e.target.value)}
 				/>
 				<button
 					type="submit"
 					disabled={loading}
 					className="w-full px-4 py-2 bg-white text-black rounded disabled:opacity-50"
 				>
 					{loading ? 'Signing in…' : 'Sign in'}
 				</button>
 				{error && <p className="text-red-400 text-sm">{error}</p>}
 			</form>
 		</main>
 	);
 }
