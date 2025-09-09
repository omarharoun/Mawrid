 import { NextResponse, type NextRequest } from 'next/server';
 import { createServerClient } from '@supabase/ssr';
 
 export async function middleware(request: NextRequest) {
 	const response = NextResponse.next({ request });
 
 	const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
 	const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
 
 	if (!supabaseUrl || !supabaseAnonKey) {
 		return response;
 	}
 
 	const supabase = createServerClient(
 		supabaseUrl,
 		supabaseAnonKey,
 		{
 			cookies: {
 				get(name) {
 					return request.cookies.get(name)?.value;
 				},
 				set(name, value, options) {
 					response.cookies.set({ name, value, ...options });
 				},
 				remove(name, options) {
 					response.cookies.set({ name, value: '', ...options });
 				},
 			},
 		}
 	);
 
 	const {
 		data: { user },
 	} = await supabase.auth.getUser();
 
 	if (!user && request.nextUrl.pathname.startsWith('/account')) {
 		const redirectUrl = new URL('/login', request.url);
 		redirectUrl.searchParams.set('redirectedFrom', request.nextUrl.pathname);
 		return NextResponse.redirect(redirectUrl);
 	}
 
 	return response;
 }
 
export const config = {
	matcher: ['/account/:path*'],
};
