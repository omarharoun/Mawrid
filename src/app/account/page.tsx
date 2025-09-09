 import Link from 'next/link';
 import { redirect } from 'next/navigation';
 import { createClient } from '@/lib/supabase/server';
 
 export default async function AccountPage() {
 	const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
 	const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
 	if (!supabaseUrl || !supabaseAnonKey) {
 		redirect('/login');
 	}
 	const supabase = createClient();
 	const {
 		data: { user },
 	} = await supabase.auth.getUser();
 
 	if (!user) {
 		redirect('/login');
 	}
 
 	return (
 		<main className="min-h-dvh flex items-center justify-center p-6">
 			<div className="max-w-xl w-full space-y-6 text-center">
 				<h1 className="text-2xl font-semibold">Account</h1>
 				<p className="text-neutral-300">Signed in as {user.email}</p>
 				<form action="/auth/sign-out" method="post">
 					<button className="px-4 py-2 bg-white text-black rounded" type="submit">Sign out</button>
 				</form>
 				<p className="text-sm">
 					<Link className="underline" href="/">Back home</Link>
 				</p>
 			</div>
 		</main>
 	);
 }
