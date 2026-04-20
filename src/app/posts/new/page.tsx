"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { fetchApi } from "@/lib/api";
import Link from "next/link";

type NewPostFormData = {
  title: string;
  body: string;
};

export default function NewPostPage() {
  const router = useRouter();
  const [apiError, setApiError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<NewPostFormData>();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
    }
  }, [router]);

  const onSubmit = async (data: NewPostFormData) => {
    setApiError("");

    try {
      await fetchApi("/posts", {
        method: "POST",
        body: JSON.stringify({
          post: data
        }),
      });
      router.push("/");
    } catch (err: any) {
      setApiError(err.message || "記事の作成に失敗しました");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full bg-white p-8 rounded-lg shadow">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">新規記事の作成</h1>
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">
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
              placeholder="記事のタイトルを入力"
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
              placeholder="Markdownなどで記事の本文を入力（今回はプレーンテキスト）"
              {...register("body", { required: "本文を入力してください" })}
            />
            {errors.body && (
              <p className="text-red-500 text-xs mt-1">{errors.body.message}</p>
            )}
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-6 py-2 rounded text-white font-medium ${
                isSubmitting ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {isSubmitting ? "投稿中..." : "投稿する"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}