"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import useSWR from "swr";
import { fetchApi } from "@/lib/api";
import Link from "next/link";

type NewPostFormData = {
  title: string;
  body: string;
  tagNames: string;
};

const parseTagNames = (raw: string): string[] => {
  return raw
    .split(",")
    .map((name) => name.trim())
    .filter((name) => name.length > 0);
};

const getErrorMessage = (err: unknown, fallback: string): string => {
  if (err instanceof Error && err.message) {
    return err.message;
  }
  return fallback;
};

const authFetcher = async (url: string) => {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (!token) throw new Error("認証が必要です");
  return fetchApi(url);
};

export default function NewPostPage() {
  const router = useRouter();
  const [apiError, setApiError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<NewPostFormData>();

  useSWR("/auth/me", authFetcher, {
    onError: () => {
      localStorage.removeItem("token");
      router.push("/login");
    },
  });

  const onSubmit = async (data: NewPostFormData) => {
    setApiError("");

    try {
      const tagNames = parseTagNames(data.tagNames);

      await fetchApi("/posts", {
        method: "POST",
        body: JSON.stringify({
          post: {
            title: data.title,
            body: data.body,
            tag_names: tagNames,
          },
        }),
      });
      router.push("/");
    } catch (err: unknown) {
      setApiError(getErrorMessage(err, "記事の作成に失敗しました"));
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              タグ（任意）
            </label>
            <input
              type="text"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              placeholder="例: rails, api, jwt"
              {...register("tagNames")}
            />
            <p className="text-xs text-gray-500 mt-1">カンマ区切りで複数指定できます</p>
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