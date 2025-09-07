 import Link from 'next/link';
 
 export default function HomePage() {
 	return (
 		<main className="min-h-dvh flex items-center justify-center p-6">
 			<div className="max-w-xl w-full space-y-6 text-center">
 				<h1 className="text-3xl font-semibold">Welcome</h1>
 				<p className="text-neutral-300">Next.js + Supabase starter ready for Vercel.</p>
 				<div className="flex items-center justify-center gap-4">
 					<Link className="px-4 py-2 bg-white text-black rounded" href="/login">Login</Link>
 					<Link className="px-4 py-2 border border-white/20 rounded" href="/account">Account</Link>
 				</div>
 			</div>
 		</main>
 	);
 }
