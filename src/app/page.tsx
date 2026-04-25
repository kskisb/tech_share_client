"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
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
  const searchParams = useSearchParams();
  const selectedTag = searchParams.get("tag")?.trim() || "";
  const fetcher = async (url: string) => fetchApi(url);

  const postsEndpoint = selectedTag ? `/posts?tag=${encodeURIComponent(selectedTag)}` : "/posts";
  const { data: postsData, isLoading: isPostsLoading } = useSWR(postsEndpoint, fetcher);
  const { data: tagsData } = useSWR("/tags", fetcher);

  const { data: userData, mutate: mutateUser } = useSWR(
    () => (typeof window !== "undefined" && localStorage.getItem("token") ? "/auth/me" : null),
    fetcher,
    {
      onError: () => {
        localStorage.removeItem("token");
      },
    }
  );

  const posts: Post[] = postsData?.data?.posts || [];
  const tags: Tag[] = tagsData?.data?.tags || [];
  const user = userData?.data?.user || null;

  const handleLogout = () => {
    localStorage.removeItem("token");
    mutateUser(null);
  };

  if (isPostsLoading) {
    return <div className="min-h-screen flex items-center justify-center">読み込み中...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-5xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-blue-600">Tech Share</h1>
          <div>
            {user ? (
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600">{user.name}さん</span>
                <Link href="/posts/new" className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700">
                  投稿する
                </Link>
                <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-gray-700">
                  ログアウト
                </button>
              </div>
            ) : (
              <div className="flex gap-3">
                <Link href="/login" className="text-blue-600 px-4 py-2 rounded text-sm border border-blue-600 hover:bg-blue-50">
                  ログイン
                </Link>
                <Link href="/signup" className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700">
                  新規登録
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">最新の記事</h2>

        <section className="mb-6">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/"
              className={`px-3 py-1 text-sm rounded-full border ${
                selectedTag
                  ? "border-gray-300 text-gray-600 hover:bg-gray-100"
                  : "border-blue-600 bg-blue-600 text-white"
              }`}
            >
              すべて
            </Link>

            {tags.map((tag) => (
              <Link
                key={tag.id}
                href={`/?tag=${encodeURIComponent(tag.name)}`}
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

          {selectedTag && (
            <p className="text-sm text-gray-600 mt-3">
              タグ <span className="font-semibold">#{selectedTag}</span> で絞り込み中
            </p>
          )}
        </section>

        {posts.length === 0 ? (
          <p className="text-gray-500">
            {selectedTag ? "このタグの記事はまだありません。" : "まだ記事がありません。"}
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <Link href={`/posts/${post.id}`} key={post.id} className="block">
                <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{post.title}</h3>

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
                    {post.body.length > 50 ? post.body.substring(0, 50) + "..." : post.body}
                  </p>

                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>いいね {post.like_count}</span>
                    <span>{new Date(post.created_at).toLocaleDateString("ja-JP")}</span>
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