import './globals.css';
import type { Metadata } from 'next';
import { ReactNode } from 'react';

export const metadata: Metadata = {
	title: 'Marid- المورد',
	description: 'Get instant answers with sources from across the web. Ask anything and get comprehensive, cited responses.',
	keywords: ['AI', 'search', 'perplexity', 'artificial intelligence', 'web search'],
	openGraph: {
		title: 'Marid- المورد',
		description: 'Get instant answers with sources from across the web',
		type: 'website',
	},
};

export default function RootLayout({ children }: { children: ReactNode }) {
	return (
		<html lang="en" className="dark">
			<body className="antialiased">
				{children}
			</body>
		</html>
	);
}
