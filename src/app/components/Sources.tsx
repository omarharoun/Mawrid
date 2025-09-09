import React from 'react';

type Source = {
    title: string;
    url: string;
    domain: string;
    snippet?: string;
    favicon?: string;
    metadata?: {
        published_date?: string;
        language?: string;
        type?: string;
    };
};

export function Sources({ items, onLinkClick }: { items: Source[]; onLinkClick: (url: string) => void }) {
    if (!items || items.length === 0) return null;
    
    return (
        <div className="max-w-4xl mr-auto">
            <div className="flex items-center space-x-2 mb-6">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="text-lg font-semibold text-gray-200">Search Results</h3>
            </div>
            <div className="space-y-4">
                    {items.slice(0, 8).map((s, idx) => (
                        <button
                            key={idx}
                            onClick={() => onLinkClick(s.url)}
                            className="group block w-full text-left rounded-xl border border-gray-700 bg-gray-900/30 p-5 hover:bg-gray-800/50 hover:border-gray-600 transition-all duration-200 hover:shadow-lg"
                        >
                        <div className="flex items-start space-x-4">
                            {/* Favicon */}
                            <div className="flex-shrink-0 w-6 h-6 mt-1">
                                {s.favicon ? (
                                    <img 
                                        src={s.favicon} 
                                        alt={s.domain}
                                        className="w-6 h-6 rounded-sm"
                                        onError={(e) => {
                                            e.currentTarget.style.display = 'none';
                                            e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                        }}
                                    />
                                ) : null}
                                <div className={`w-6 h-6 bg-gray-700 rounded-sm flex items-center justify-center ${s.favicon ? 'hidden' : ''}`}>
                                    <svg className="w-3 h-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                    </svg>
                                </div>
                            </div>
                            
                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2 mb-1">
                                    <h4 className="text-lg font-medium text-blue-400 group-hover:text-blue-300 transition-colors line-clamp-1">
                                        {s.title || s.domain}
                                    </h4>
                                    <svg className="w-3 h-3 text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                    </svg>
                                </div>
                                
                                <div className="text-sm text-green-400 mb-2">
                                    {s.url}
                                </div>
                                
                                {s.snippet && (
                                    <p className="text-sm text-gray-300 line-clamp-2 leading-relaxed">
                                        {s.snippet}
                                    </p>
                                )}
                                
                                <div className="flex items-center space-x-3 mt-2 text-xs text-gray-500">
                                    <span className="flex items-center space-x-1">
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <span>{s.metadata?.published_date ? new Date(s.metadata.published_date).toLocaleDateString() : 'Recently'}</span>
                                    </span>
                                    {s.metadata?.language && s.metadata.language !== 'en' && (
                                        <>
                                            <span>•</span>
                                            <span className="uppercase">{s.metadata.language}</span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
}

