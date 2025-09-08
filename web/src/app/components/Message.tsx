import React from 'react';

type MessageProps = {
    role: 'user' | 'assistant';
    content: React.ReactNode;
};

export function Message({ role, content }: MessageProps) {
    return (
        <div className="w-full">
            {role === 'user' ? (
                <div className="max-w-3xl ml-auto">
                    <div className="bg-white text-black rounded-2xl px-6 py-4 shadow-lg">
                        {typeof content === 'string' ? (
                            <p className="leading-relaxed whitespace-pre-wrap text-base">{content}</p>
                        ) : (
                            content
                        )}
                    </div>
                </div>
            ) : (
                <div className="max-w-4xl mr-auto">
                    <div className="bg-gray-900/50 border border-gray-700 rounded-2xl px-6 py-5">
                        <div className="prose prose-invert max-w-none">
                            {typeof content === 'string' ? (
                                <p className="leading-relaxed whitespace-pre-wrap text-base text-white">{content}</p>
                            ) : (
                                content
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

