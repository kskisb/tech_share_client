"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import useSWR from "swr";
import { fetchApi } from "@/lib/api";

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
  like_count: number;
  liked_by_current_user?: boolean;
  tags?: { id: number; name: string }[];
  comments?: Comment[];
};

type User = {
  id: number;
  name: string;
  email: string;
};

const getErrorMessage = (err: unknown, fallback: string): string => {
  if (err instanceof Error && err.message) return err.message;
  return fallback;
};

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const postId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [commentBody, setCommentBody] = useState("");
  const [commentError, setCommentError] = useState("");
  const [isCommentSubmitting, setIsCommentSubmitting] = useState(false);
  const [isDeletingCommentId, setIsDeletingCommentId] = useState<number | null>(
    null,
  );

  const [isLikeSubmitting, setIsLikeSubmitting] = useState(false);
  const [likeError, setLikeError] = useState("");
  const [likeOptimistic, setLikeOptimistic] = useState<{
    liked: boolean;
    count: number;
  } | null>(null);

  const fetcher = (url: string) => fetchApi(url);

  const {
    data: postData,
    error: postError,
    isLoading: isPostLoading,
    mutate: mutatePost,
  } = useSWR(postId ? "/posts/" + postId : null, fetcher);

  const { data: userData } = useSWR(
    () =>
      typeof window !== "undefined" && localStorage.getItem("token")
        ? "/auth/me"
        : null,
    fetcher,
    {
      onError: () => {
        localStorage.removeItem("token");
      },
    },
  );

  const post: PostDetail | undefined = postData?.data?.post;
  const currentUser: User | undefined = userData?.data?.user;
  const comments = post?.comments || [];
  const isMyPost = currentUser?.id === post?.user_id;
  const liked = likeOptimistic?.liked ?? Boolean(post?.liked_by_current_user);
  const likeCount = likeOptimistic?.count ?? post?.like_count ?? 0;

  const handleCommentSubmit = async (
    e: React.SyntheticEvent<HTMLFormElement>,
  ) => {
    e.preventDefault();

    if (!currentUser) {
      setCommentError("コメント投稿にはログインが必要です");
      return;
    }
    if (!postId) return;

    setIsCommentSubmitting(true);
    setCommentError("");

    try {
      await fetchApi("/posts/" + postId + "/comments", {
        method: "POST",
        body: JSON.stringify({
          comment: { body: commentBody },
        }),
      });
      setCommentBody("");
      await mutatePost();
    } catch (err: unknown) {
      setCommentError(getErrorMessage(err, "コメントの投稿に失敗しました"));
    } finally {
      setIsCommentSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("本当にこの記事を削除しますか？")) return;

    try {
      await fetchApi("/posts/" + postId, { method: "DELETE" });
      router.push("/");
    } catch (err: unknown) {
      alert(getErrorMessage(err, "削除に失敗しました"));
    }
  };

  const handleCommentDelete = async (commentId: number) => {
    if (!postId) return;
    if (!window.confirm("本当にこのコメントを削除しますか？")) return;

    setIsDeletingCommentId(commentId);

    try {
      await fetchApi("/posts/" + postId + "/comments/" + commentId, {
        method: "DELETE",
      });
      await mutatePost();
    } catch (err: unknown) {
      alert(getErrorMessage(err, "コメントの削除に失敗しました"));
    } finally {
      setIsDeletingCommentId(null);
    }
  };

  const handleToggleLike = async () => {
    if (!currentUser) return;
    if (!postId || !post || isLikeSubmitting) return;

    setIsLikeSubmitting(true);
    setLikeError("");

    const baseLiked =
      likeOptimistic?.liked ?? Boolean(post.liked_by_current_user);
    const baseCount = likeOptimistic?.count ?? post.like_count ?? 0;
    const nextLiked = !baseLiked;

    setLikeOptimistic({
      liked: nextLiked,
      count: nextLiked ? baseCount + 1 : Math.max(0, baseCount - 1),
    });

    try {
      await fetchApi("/posts/" + postId + "/like", {
        method: nextLiked ? "POST" : "DELETE",
      });
      await mutatePost();
      setLikeOptimistic(null);
    } catch (err: unknown) {
      setLikeOptimistic(null);
      setLikeError(
        getErrorMessage(
          err,
          nextLiked ? "いいねに失敗しました" : "いいね解除に失敗しました",
        ),
      );
    } finally {
      setIsLikeSubmitting(false);
    }
  };

  if (isPostLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        読み込み中...
      </div>
    );
  }

  if (postError || !post) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <p className="text-red-600 mb-4">
          {postError?.message || "記事が見つかりません"}
        </p>
        <Link href="/" className="text-blue-600 hover:underline">
          トップへ戻る
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-5 text-sm">
          <Link href="/" className="text-blue-600 hover:underline">
            記事一覧
          </Link>
          <span className="mx-2 text-gray-400">/</span>
          <span className="text-gray-500">記事詳細</span>
        </div>

        <article className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 sm:p-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight mb-4">
            {post.title}
          </h1>

          <div className="flex flex-wrap items-center gap-2 mb-4">
            {(post.tags || []).map((tag) => (
              <span
                key={tag.id}
                className="px-2.5 py-1 text-xs rounded-full bg-slate-100 text-slate-700 border border-slate-200"
              >
                #{tag.name}
              </span>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-gray-500 border-y border-gray-200 py-3 mb-6">
            <div className="flex items-center gap-4">
              <span>
                {new Date(post.created_at).toLocaleDateString("ja-JP")}
              </span>
            </div>

            {isMyPost && (
              <div className="flex items-center gap-2">
                <Link
                  href={"/posts/" + post.id + "/edit"}
                  className="px-3 py-1.5 rounded border border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  編集
                </Link>
                <button
                  onClick={handleDelete}
                  className="px-3 py-1.5 rounded border border-red-300 text-red-600 hover:bg-red-50"
                >
                  削除
                </button>
              </div>
            )}
          </div>

          <div className="mb-6">
            {currentUser ? (
              <div className="inline-flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleToggleLike}
                  disabled={isLikeSubmitting}
                  aria-label={liked ? "いいね解除" : "いいね"}
                  className={
                    liked
                      ? "h-10 w-10 rounded-full border border-rose-300 bg-rose-50 text-rose-600 hover:bg-rose-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                      : "h-10 w-10 rounded-full border border-gray-300 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  }
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="h-5 w-5 fill-current"
                    aria-hidden="true"
                  >
                    <path d="M12 21s-6.716-4.35-9.192-8.144C1.06 10.21 1.5 6.83 4.186 5.29c2.03-1.164 4.572-.78 6.314.93l1.5 1.47 1.5-1.47c1.742-1.71 4.283-2.094 6.314-.93 2.687 1.54 3.126 4.92 1.378 7.566C18.716 16.65 12 21 12 21z" />
                  </svg>
                </button>
                <span className="text-sm font-medium text-gray-700">
                  {likeCount}
                </span>
              </div>
            ) : (
              <p className="text-sm text-gray-600">
                いいねするには
                <Link
                  href="/login"
                  className="ml-1 text-blue-600 hover:underline"
                >
                  ログイン
                </Link>
                してください。
              </p>
            )}
            {likeError && (
              <p className="text-sm text-red-600 mt-2">{likeError}</p>
            )}
          </div>

          <div className="prose prose-slate max-w-none whitespace-pre-wrap text-gray-800">
            {post.body}
          </div>
        </article>

        <section className="mt-8 bg-white border border-gray-200 rounded-xl shadow-sm p-6 sm:p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">コメント</h2>

          {currentUser ? (
            <form onSubmit={handleCommentSubmit} className="mb-6">
              <textarea
                value={commentBody}
                onChange={(e) => setCommentBody(e.target.value)}
                placeholder="コメントを入力してください"
                rows={4}
                required
                className="w-full rounded-lg border border-gray-300 p-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="mt-3 flex items-center justify-between">
                {commentError ? (
                  <p className="text-sm text-red-600">{commentError}</p>
                ) : (
                  <div />
                )}
                <button
                  type="submit"
                  disabled={
                    isCommentSubmitting || commentBody.trim().length === 0
                  }
                  className="px-4 py-2 rounded-lg text-sm text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isCommentSubmitting ? "投稿中..." : "コメントを投稿"}
                </button>
              </div>
            </form>
          ) : (
            <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
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
                <div
                  key={comment.id}
                  className="rounded-lg border border-gray-200 bg-white p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="text-gray-800 whitespace-pre-wrap">
                        {comment.body}
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        {new Date(comment.created_at).toLocaleString("ja-JP")}
                      </p>
                    </div>

                    {currentUser &&
                      (currentUser.id === comment.user_id ||
                        currentUser.id === post.user_id) && (
                        <button
                          type="button"
                          onClick={() => handleCommentDelete(comment.id)}
                          disabled={isDeletingCommentId === comment.id}
                          className="shrink-0 text-xs px-3 py-1 rounded border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isDeletingCommentId === comment.id
                            ? "削除中..."
                            : "削除"}
                        </button>
                      )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
