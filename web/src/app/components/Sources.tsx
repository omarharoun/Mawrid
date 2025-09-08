import React from 'react';

type Source = {
    title: string;
    url: string;
    domain: string;
};

export function Sources({ items }: { items: Source[] }) {
    if (!items || items.length === 0) return null;
    
    return (
        <div className="max-w-4xl mr-auto">
            <div className="flex items-center space-x-2 mb-4">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="text-sm font-medium text-gray-300">Sources</h3>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
                {items.slice(0, 6).map((s, idx) => (
                    <a 
                        key={idx} 
                        href={s.url} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="group block rounded-xl border border-gray-700 bg-gray-900/30 p-4 hover:bg-gray-800/50 hover:border-gray-600 transition-all duration-200 hover:shadow-lg"
                    >
                        <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0 w-8 h-8 bg-gray-700 rounded-lg flex items-center justify-center group-hover:bg-gray-600 transition-colors">
                                <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-white truncate group-hover:text-blue-400 transition-colors">
                                    {s.title || s.domain}
                                </div>
                                <div className="text-xs text-gray-400 truncate mt-1">
                                    {s.domain}
                                </div>
                            </div>
                        </div>
                    </a>
                ))}
            </div>
        </div>
    );
}

