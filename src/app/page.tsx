"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import useSWR from "swr";
import { fetchApi } from "@/lib/api";

type Post = {
  id: number;
  user_id: number;
  title: string;
  body: string;
  created_at: string;
  like_count: number;
  tags?: { id: number; name: string }[];
};

type Tag = {
  id: number;
  name: string;
  created_at: string;
};

export default function HomePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedTag = searchParams.get("tag")?.trim() || "";
  const searchQuery = searchParams.get("q")?.trim() || "";
  const [inputValue, setInputValue] = useState(searchQuery);
  const fetcher = async (url: string) => fetchApi(url);

  // エンドポイントを動的に構築
  const buildPostsEndpoint = () => {
    const params = new URLSearchParams();
    if (searchQuery) params.append("q", searchQuery);
    if (selectedTag) params.append("tag", selectedTag);
    const query = params.toString();
    return query ? `/posts?${query}` : "/posts";
  };

  const postsEndpoint = buildPostsEndpoint();
  const { data: postsData, isLoading: isPostsLoading } = useSWR(
    postsEndpoint,
    fetcher,
  );
  const { data: tagsData } = useSWR("/tags", fetcher);

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (inputValue.trim()) {
      const params = new URLSearchParams();
      params.append("q", inputValue.trim());
      router.push(`/?${params.toString()}`);
    } else {
      router.push("/");
    }
  };

  const posts: Post[] = postsData?.data?.posts || [];
  const tags: Tag[] = tagsData?.data?.tags || [];

  if (isPostsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        読み込み中...
      </div>
    );
  }

  // タグリンク用ヘルパー：既存の `q` パラメータを保持
  const buildTagLink = (tagName: string) => {
    const params = new URLSearchParams();
    if (searchQuery) params.append("q", searchQuery);
    params.append("tag", tagName);
    return `/?${params.toString()}`;
  };

  // "すべて" リンク用ヘルパー：`q` があれば保持、なければ "/"
  const buildAllLink = () => {
    if (searchQuery) {
      return `/?q=${encodeURIComponent(searchQuery)}`;
    }
    return "/";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-5xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">最新の記事</h2>

        <section className="mb-6">
          <form onSubmit={handleSearch} className="mb-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="記事を検索..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                検索
              </button>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setInputValue("");
                    router.push("/");
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                >
                  クリア
                </button>
              )}
            </div>
            {searchQuery && (
              <p className="text-sm text-gray-600 mt-2">
                検索キー:{" "}
                <span className="font-semibold">&quot;{searchQuery}&quot;</span>
              </p>
            )}
          </form>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={buildAllLink()}
              className={`px-3 py-1 text-sm rounded-full border ${
                selectedTag || searchQuery
                  ? "border-gray-300 text-gray-600 hover:bg-gray-100"
                  : "border-blue-600 bg-blue-600 text-white"
              }`}
            >
              すべて
            </Link>

            {tags.map((tag) => (
              <Link
                key={tag.id}
                href={buildTagLink(tag.name)}
                className={`px-3 py-1 text-sm rounded-full border ${
                  selectedTag === tag.name
                    ? "border-blue-600 bg-blue-600 text-white"
                    : "border-gray-300 text-gray-600 hover:bg-gray-100"
                }`}
              >
                #{tag.name}
              </Link>
            ))}
          </div>

          {(searchQuery || selectedTag) && (
            <p className="text-sm text-gray-600 mt-3">
              {searchQuery && selectedTag ? (
                <>
                  検索キー{" "}
                  <span className="font-semibold">
                    &quot;{searchQuery}&quot;
                  </span>{" "}
                  + タグ <span className="font-semibold">#{selectedTag}</span>{" "}
                  で絞り込み中
                </>
              ) : searchQuery ? (
                <>
                  検索キー{" "}
                  <span className="font-semibold">
                    &quot;{searchQuery}&quot;
                  </span>{" "}
                  で検索中
                </>
              ) : (
                <>
                  タグ <span className="font-semibold">#{selectedTag}</span>{" "}
                  で絞り込み中
                </>
              )}
            </p>
          )}
        </section>

        {posts.length === 0 ? (
          <p className="text-gray-500">
            {selectedTag
              ? "このタグの記事はまだありません。"
              : "まだ記事がありません。"}
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <Link href={`/posts/${post.id}`} key={post.id} className="block">
                <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    {post.title}
                  </h3>

                  {post.tags && post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {post.tags.map((tag) => (
                        <span
                          key={`${post.id}-${tag.id}`}
                          className="px-2 py-0.5 text-xs rounded-full bg-blue-50 text-blue-700 border border-blue-200"
                        >
                          #{tag.name}
                        </span>
                      ))}
                    </div>
                  )}

                  <p className="text-gray-600 text-sm mb-3">
                    {post.body.length > 50
                      ? post.body.substring(0, 50) + "..."
                      : post.body}
                  </p>

                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>いいね {post.like_count}</span>
                    <span>
                      {new Date(post.created_at).toLocaleDateString("ja-JP")}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
