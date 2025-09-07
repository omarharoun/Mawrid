import React from 'react';

type MessageProps = {
    role: 'user' | 'assistant';
    content: React.ReactNode;
};

export function Message({ role, content }: MessageProps) {
    return (
        <div className="w-full">
            <div className={
                role === 'user'
                    ? 'max-w-3xl ml-auto rounded-2xl px-4 py-3 bg-white text-black'
                    : 'max-w-3xl mr-auto rounded-2xl px-4 py-3 bg-white/5 border border-white/10'
            }>
                {typeof content === 'string' ? (
                    <p className="leading-relaxed whitespace-pre-wrap">{content}</p>
                ) : (
                    content
                )}
            </div>
        </div>
    );
}

