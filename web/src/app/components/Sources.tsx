import React from 'react';

type Source = {
    title: string;
    url: string;
    domain: string;
};

export function Sources({ items }: { items: Source[] }) {
    if (!items || items.length === 0) return null;
    return (
        <div className="max-w-3xl mr-auto">
            <div className="text-sm text-neutral-400 mb-2">Sources</div>
            <div className="grid sm:grid-cols-2 gap-3">
                {items.slice(0, 6).map((s, idx) => (
                    <a key={idx} href={s.url} target="_blank" rel="noreferrer" className="group block rounded-xl border border-white/10 bg-white/5 p-3 hover:bg-white/10 transition">
                        <div className="text-sm font-medium truncate group-hover:underline">{s.title || s.domain}</div>
                        <div className="text-xs text-neutral-400 truncate">{s.url}</div>
                    </a>
                ))}
            </div>
        </div>
    );
}

