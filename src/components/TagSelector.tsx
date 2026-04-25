"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import { fetchApi } from "@/lib/api";

type Tag = {
  id: number;
  name: string;
};

type TagSelectorProps = {
  selectedTags: string[];
  onChange: (tags: string[]) => void;
  disabled?: boolean;
};

const normalizeTagName = (value: string): string => value.trim().toLowerCase();

export default function TagSelector({ selectedTags, onChange, disabled = false }: TagSelectorProps) {
  const [customTagInput, setCustomTagInput] = useState("");
  const fetcher = (url: string) => fetchApi(url);
  const { data } = useSWR("/tags", fetcher);

  const candidateTags: Tag[] = data?.data?.tags || [];

  const selectedTagSet = useMemo(() => {
    return new Set(selectedTags.map((name) => normalizeTagName(name)));
  }, [selectedTags]);

  const toggleTag = (tagName: string) => {
    if (disabled) return;

    const normalized = normalizeTagName(tagName);
    const alreadySelected = selectedTagSet.has(normalized);

    if (alreadySelected) {
      onChange(selectedTags.filter((name) => normalizeTagName(name) != normalized));
      return;
    }

    onChange([ ...selectedTags, tagName ]);
  };

  const addCustomTag = () => {
    if (disabled) return;

    const trimmed = customTagInput.trim();
    if (!trimmed) return;

    const normalized = normalizeTagName(trimmed);
    if (selectedTagSet.has(normalized)) {
      setCustomTagInput("");
      return;
    }

    onChange([ ...selectedTags, trimmed ]);
    setCustomTagInput("");
  };

  const removeTag = (tagName: string) => {
    if (disabled) return;
    const normalized = normalizeTagName(tagName);
    onChange(selectedTags.filter((name) => normalizeTagName(name) != normalized));
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {candidateTags.map((tag) => {
          const isSelected = selectedTagSet.has(normalizeTagName(tag.name));

          return (
            <button
              key={tag.id}
              type="button"
              onClick={() => toggleTag(tag.name)}
              disabled={disabled}
              className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                isSelected
                  ? "border-blue-600 bg-blue-600 text-white"
                  : "border-gray-300 text-gray-700 hover:bg-gray-100"
              } ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
            >
              #{tag.name}
            </button>
          );
        })}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={customTagInput}
          onChange={(e) => setCustomTagInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key == "Enter") {
              e.preventDefault();
              addCustomTag();
            }
          }}
          placeholder="新しいタグを追加"
          disabled={disabled}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="button"
          onClick={addCustomTag}
          disabled={disabled}
          className="px-4 py-2 text-sm rounded bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          追加
        </button>
      </div>

      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedTags.map((tagName) => (
            <span
              key={tagName}
              className="inline-flex items-center gap-1 px-3 py-1 text-sm rounded-full bg-blue-50 text-blue-700 border border-blue-200"
            >
              #{tagName}
              <button
                type="button"
                onClick={() => removeTag(tagName)}
                disabled={disabled}
                className="text-blue-700/80 hover:text-blue-900"
                aria-label={`タグ ${tagName} を削除`}
              >
                x
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}