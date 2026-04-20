"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { fetchApi } from "@/lib/api";
import Link from "next/link";

export default function EditPostPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id;

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    const fetchPost = async () => {
      try {
        const postData = await fetchApi(`/posts/${id}`);
        setTitle(postData.data.post.title);
        setBody(postData.data.post.body);
      } catch (err: any) {
        setError(err.message || "記事の取得に失敗しました");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPost();
  }, [id, router]);

  const handleSubmit = async(e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await fetchApi(`/posts/${id}`, {
        method: "PUT",
        body: JSON.stringify({
          post: { title, body }
        }),
      });
      router.push(`/posts/${id}`);
    } catch (err: any) {
      setError(err.message || "記事の更新に失敗しました");
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">読み込み中...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full bg-white p-8 rounded-lg shadow">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">記事の編集</h1>
          {/* キャンセル時は詳細画面に戻る */}
          <Link href={`/posts/${id}`} className="text-sm text-gray-500 hover:text-gray-700">
            キャンセル
          </Link>
        </div>

        {error && (
          <div className="bg-red-50 text-red-500 p-3 rounded mb-6 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              タイトル
            </label>
            <input
              type="text"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              本文
            </label>
            <textarea
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 h-64"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              required
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-6 py-2 rounded text-white font-medium ${
                isSubmitting ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {isSubmitting ? "更新中..." : "更新する"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}