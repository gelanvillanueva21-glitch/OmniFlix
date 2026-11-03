"use client";

import type { SuwayomiSourceInfo } from "@/service/suwayomi/suwayomi.service";

interface SourceSelectorProps {
    sources: SuwayomiSourceInfo[];
    selectedType: string | null;
    onSelect: (type: string) => void;
}

export function SourceSelector({
    sources,
    selectedType,
    onSelect,
}: SourceSelectorProps) {
    return (
        <div>
            <label
                htmlFor="comics-source"
                className="comics-source-label"
            >
                Comic source
            </label>
            <select
                id="comics-source"
                value={selectedType ?? ""}
                onChange={(event) => onSelect(event.target.value)}
                className="comics-source-select"
            >
                {sources.map((source) => (
                    <option key={source.id} value={source.type}>
                        {source.displayName}
                    </option>
                ))}
            </select>
        </div>
    );
}
