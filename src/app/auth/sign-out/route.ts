 import { NextResponse } from 'next/server';
 import { createClient } from '@/lib/supabase/server';
 
 export async function POST() {
 	const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
 	const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
 	if (!supabaseUrl || !supabaseAnonKey) {
 		return NextResponse.redirect(new URL('/', process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'));
 	}
 	const supabase = createClient();
 	await supabase.auth.signOut();
 	return NextResponse.redirect(new URL('/', process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'));
 }
