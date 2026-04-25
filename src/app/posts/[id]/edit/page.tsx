// src/app/posts/[id]/edit/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import useSWR from "swr";
import { fetchApi } from "@/lib/api";
import TagSelector from "@/components/TagSelector";
import Link from "next/link";

// フォームデータの型定義
type EditPostFormData = {
  title: string;
  body: string;
};

type PostTag = {
  id: number;
  name: string;
};

const getErrorMessage = (err: unknown, fallback: string): string => {
  if (err instanceof Error && err.message) {
    return err.message;
  }
  return fallback;
};

export default function EditPostPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id;

  const [apiError, setApiError] = useState("");
  const [tagDraft, setTagDraft] = useState<string[] | null>(null);

  const fetcher = (url: string) => fetchApi(url);

  const { data: postData, error: loadError, isLoading } = useSWR(
    id ? `/posts/${id}` : null,
    fetcher
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EditPostFormData>({
    values: postData?.data?.post ? {
      title: postData.data.post.title,
      body: postData.data.post.body,
    } : undefined,
  });

  const initialTags: string[] = ((postData?.data?.post?.tags as PostTag[] | undefined) || []).map(
    (tag) => tag.name
  );
  const selectedTags = tagDraft ?? initialTags;

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
    }
  }, [router]);

  const onSubmit = async (data: EditPostFormData) => {
    setApiError("");

    try {
      const postPayload: { title: string; body: string; tag_names: string[] } = {
        title: data.title,
        body: data.body,
        tag_names: selectedTags,
      };

      await fetchApi(`/posts/${id}`, {
        method: "PUT",
        body: JSON.stringify({
          post: postPayload,
        }),
      });
      router.push(`/posts/${id}`);
    } catch (err: unknown) {
      setApiError(getErrorMessage(err, "記事の更新に失敗しました"));
    }
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">読み込み中...</div>;
  }

  if (loadError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <p className="text-red-500 mb-4">{loadError.message || "記事の取得に失敗しました"}</p>
        <Link href="/" className="text-blue-600 hover:underline">トップへ戻る</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full bg-white p-8 rounded-lg shadow">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">記事の編集</h1>
          <Link href={`/posts/${id}`} className="text-sm text-gray-500 hover:text-gray-700">
            キャンセル
          </Link>
        </div>

        {apiError && (
          <div className="bg-red-50 text-red-500 p-3 rounded mb-6 text-sm">
            {apiError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              タイトル
            </label>
            <input
              type="text"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              {...register("title", { required: "タイトルを入力してください" })}
            />
            {errors.title && (
              <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              本文
            </label>
            <textarea
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 h-64"
              {...register("body", { required: "本文を入力してください" })}
            />
            {errors.body && (
              <p className="text-red-500 text-xs mt-1">{errors.body.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              タグ（任意）
            </label>
            <TagSelector
              selectedTags={selectedTags}
              onChange={setTagDraft}
              disabled={isSubmitting}
            />
            <p className="text-xs text-gray-500 mt-1">
              候補から選択、または新しいタグを追加できます
            </p>
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