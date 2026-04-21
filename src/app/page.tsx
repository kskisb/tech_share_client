"use client";

import Link from "next/link";
import useSWR from "swr";
import { fetchApi } from "@/lib/api";

type Post = {
  id: number;
  user_id: number;
  title: string;
  body: string;
  created_at: string;
}

export default function HomePage() {
  const fetcher = async (url: string) => fetchApi(url);

  const { data: postsData, isLoading: isPostsLoading } = useSWR("/posts", fetcher);

  const { data: userData, mutate: mutateUser } =useSWR(
    () => (typeof window !== "undefined" && localStorage.getItem("token") ? "/auth/me" : null),
    fetcher,
    {
      onError: () => {
        localStorage.removeItem("token");
      },
    }
  );

  const posts: Post[] = postsData?.data?.posts || [];
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
      {/* 画面上部のヘッダー（ナビゲーションバー） */}
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

      {/* 記事一覧部分 */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">最新の記事</h2>

        {posts.length === 0 ? (
          <p className="text-gray-500">まだ記事がありません。</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* posts配列をループして、１件ずつカードとして表示 */}
            {posts.map((post) => (
              <Link href={`/posts/${post.id}`} key={post.id} className="block">
                <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{post.title}</h3>
                  {/* 本文は先頭50文字だけ表示（プレビュー用） */}
                  <p className="text-gray-600 text-sm mb-4">
                    {post.body.length > 50 ? post.body.substring(0, 50) + "..." : post.body}
                  </p>
                  <div className="text-xs text-gray-400 text-right">
                    {new Date(post.created_at).toLocaleDateString("ja-JP")}
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