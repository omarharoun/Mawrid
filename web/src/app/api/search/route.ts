import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

export async function POST(request: Request) {
    try {
        const { query, limit = 20, offset = 0, filters } = await request.json();
        const params = new URLSearchParams({ query, limit: String(limit), offset: String(offset) });

        const response = await fetch(`${BACKEND_URL}/api/search/?${params.toString()}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(filters || {}),
        });

        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        return NextResponse.json({ detail: 'Proxy error' }, { status: 500 });
    }
}

export async function GET(request: Request) {
    try {
        const url = new URL(request.url);
        const query = url.searchParams.get('query') || '';
        const params = new URLSearchParams({ query });
        const response = await fetch(`${BACKEND_URL}/api/search/suggestions?${params.toString()}`);
        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        return NextResponse.json({ detail: 'Proxy error' }, { status: 500 });
    }
}

