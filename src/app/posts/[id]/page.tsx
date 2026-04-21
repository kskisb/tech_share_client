"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import useSWR from "swr";
import { fetchApi } from "@/lib/api";
import Link from "next/link";

type Comment = {
  id: number;
  user_id: number;
  body: string;
  created_at: string;
};

type PostDetail = {
  id: number;
  user_id: number;
  title: string;
  body: string;
  created_at: string;
  comments?: Comment[];
}

type User = {
  id: number;
  name: string;
  email: string
}

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const postId = Array.isArray(params.id) ? params.id[0] : params.id;
  const [commentBody, setCommentBody] = useState("");
  const [commentError, setCommentError] = useState("");
  const [isCommentSubmitting, setIsCommentSubmitting] = useState(false);

  const fetcher = (url: string) => fetchApi(url);

  const { data: postData, error: postError, isLoading: isPostLoading, mutate: mutatePost } = useSWR(
    postId ? `/posts/${postId}` : null,
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
  const comments = post?.comments || [];

  const handleCommentSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!currentUser) {
      setCommentError("コメント投稿にはログインが必要です");
      return;
    }

    if (!postId) return;

    setIsCommentSubmitting(true);
    setCommentError("");

    try {
      await fetchApi(`/posts/${postId}/comments`, {
        method: "POST",
        body: JSON.stringify({
          comment: {
            body: commentBody,
          },
        }),
      });

      setCommentBody("");
      await mutatePost();
    } catch (err: any) {
      setCommentError(err.message || "コメントの投稿に失敗しました");
    } finally {
      setIsCommentSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("本当にこの記事を削除しますか？")) return;

    try {
      await fetchApi(`/posts/${postId}`, { method: "DELETE" });
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

          <section className="mt-10 border-t pt-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">コメント</h2>

            {currentUser ? (
              <form onSubmit={handleCommentSubmit} className="mb-6">
                <textarea
                  value={commentBody}
                  onChange={(e) => setCommentBody(e.target.value)}
                  placeholder="コメントを入力してください"
                  className="w-full bg-white text-gray-900 placeholder:text-gray-400 border border-gray-300 rounded p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={4}
                  required
                />
                <div className="mt-3 flex items-center justify-between">
                  {commentError ? <p className="text-sm text-red-600">{commentError}</p> : <div />}
                  <button
                    type="submit"
                    disabled={isCommentSubmitting || commentBody.trim().length === 0}
                    className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {isCommentSubmitting ? "投稿中..." : "コメントを投稿"}
                  </button>
                </div>
              </form>
            ) : (
              <div className="mb-6 bg-blue-50 border border-blue-100 rounded p-3 text-sm text-blue-900">
                コメントを投稿するには
                <Link href="/login" className="ml-1 underline">
                  ログイン
                </Link>
                してください。
              </div>
            )}

            {comments.length === 0 ? (
              <p className="text-sm text-gray-500">まだコメントはありません。</p>
            ) : (
              <div className="space-y-3">
                {comments.map((comment) => (
                  <div key={comment.id} className="bg-white border border-gray-200 rounded p-3">
                    <p className="text-gray-800 whitespace-pre-wrap">{comment.body}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      {new Date(comment.created_at).toLocaleString("ja-JP")}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </article>
      </main>
    </div>
  );
}