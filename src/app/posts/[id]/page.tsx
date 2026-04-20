"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { fetchApi } from "@/lib/api";
import Link from "next/link";

type PostDetail = {
  id: number;
  user_id: number;
  title: string;
  body: string;
  created_at: string;
}

type User = {
  id: number;
  name: string;
  email: string
}

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id;

  const [post, setPost] = useState<PostDetail | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const postData = await fetchApi(`/posts/${id}`);
        setPost(postData.data.post);

        const token = localStorage.getItem("token");
        if (token) {
          try {
            const userData = await fetchApi("/auth/me");
            setCurrentUser(userData.data.user);
          } catch (err) {
            // トークンが無効なら何もしない
          }
        }
      } catch (err: any) {
        setError(err.message || "記事の取得に失敗しました");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm("本当にこの記事を削除しますか？")) return;

    try {
      await fetchApi(`/posts/${id}`, { method: "DELETE" });
      router.push("/");
    } catch (err: any) {
      alert(err.message || "削除に失敗しました");
    }
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">読み込み中...</div>;
  }

  if (error || !post) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <p className="text-red-500 mb-4">{error || "記事が見つかりません"}</p>
        <Link href="/" className="text-blue-600 hover:underline">トップへ戻る</Link>
      </div>
    );
  }

  const isMyPost = currentUser?.id === post.user_id;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <main className="max-w-3xl mx-auto px-4">
        {/* トップへ戻るリンク */}
        <div className="mb-6">
          <Link href="/" className="text-blue-600 hover:underline flex items-center">
            ← 記事一覧に戻る
          </Link>
        </div>

        <article className="bg-white p-8 rounded-lg shadow">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{post.title}</h1>
          <div className="flex justify-between items-center text-sm text-gray-500 border-b pb-4 mb-6">
            <span>投稿日: {new Date(post.created_at).toLocaleDateString("ja-JP")}</span>

            {isMyPost && (
              <div className="flex gap-3">
                <Link
                  href={`/posts/${post.id}/edit`}
                  className="text-gray-600 hover:text-blue-600 px-3 py-1 border rounded"
                >
                  編集
                </Link>
                <button
                  onClick={handleDelete}
                  className="text-red-600 hover:bg-red-50 px-3 py-1 border border-red-600 rounded"
                >
                  削除
                </button>
              </div>
            )}
          </div>

          <div className="prose max-w-none text-gray-800 whitespace-pre-wrap">
            {post.body}
          </div>
        </article>
      </main>
    </div>
  );
}