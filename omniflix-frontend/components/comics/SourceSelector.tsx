"use client";

import type { SuwayomiSourceInfo } from "@/service/suwayomi.service";

interface SourceSelectorProps {
    sources: SuwayomiSourceInfo[];
    selectedId: string | null;
    onSelect: (id: string) => void;
}

export function SourceSelector({
    sources,
    selectedId,
    onSelect,
}: SourceSelectorProps) {
    return (
        <div>
            <label
                htmlFor="comics-source"
                className="mb-1 block text-xs font-medium text-[#A1A1AA]"
            >
                Comic source
            </label>
            <select
                id="comics-source"
                value={selectedId ?? ""}
                onChange={(event) => onSelect(event.target.value)}
                className="w-full rounded-lg border-[#29292E] bg-[#111] px-3 py-2 text-sm text-[#F5F5F5] focus:border-[#8B5CF6] focus:outline-none focus-visible:ring-1 focus-visible:ring-[#8B5CF6]"
            >
                {sources.map((source) => (
                    <option key={source.id} value={source.id}>
                        {source.displayName} ({source.lang})
                    </option>
                ))}
            </select>
        </div>
    );
}
