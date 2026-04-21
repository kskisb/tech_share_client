"use client";

import { useParams, useRouter } from "next/navigation";
import useSWR from "swr";
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

  const fetcher = (url: string) => fetchApi(url);

  const { data: postData, error: postError, isLoading: isPostLoading } = useSWR(
    id ? `/posts/${id}` : null,
    fetcher
  );

  const { data: userData } = useSWR(
    () => (typeof window !== "undefined" && localStorage.getItem("token") ? "/auth/me" : null),
    fetcher,
    {
      onError: () => {
        localStorage.removeItem("token");
      }
    }
  );

  const post: PostDetail | undefined = postData?.data?.post;
  const currentUser: User | undefined = userData?.data?.user;

  const handleDelete = async () => {
    if (!window.confirm("本当にこの記事を削除しますか？")) return;

    try {
      await fetchApi(`/posts/${id}`, { method: "DELETE" });
      router.push("/");
    } catch (err: any) {
      alert(err.message || "削除に失敗しました");
    }
  };

  if (isPostLoading) {
    return <div className="min-h-screen flex items-center justify-center">読み込み中...</div>;
  }

  if (postError || !post) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <p className="text-red-500 mb-4">{postError?.message || "記事が見つかりません"}</p>
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