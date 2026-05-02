"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import useSWR from "swr";
import { fetchApi } from "@/lib/api";
import Link from "next/link";

type LoginFormData = {
  email: string;
  password: string;
};

const authFetcher = async (url: string) => {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (!token) throw new Error("認証が必要です");
  return fetchApi(url);
};

export default function LoginPage() {
  const router = useRouter();
  const [apiError, setApiError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>();

  useSWR("/auth/me", authFetcher, {
    onError: () => {
      localStorage.removeItem("token");
      router.push("/login");
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setApiError("");

    try {
      const responseData = await fetchApi("/auth/login", {
        method: "POST",
        body: JSON.stringify(data),
      });

      if (responseData?.meta?.token) {
        localStorage.setItem("token", responseData.meta.token);
        router.push("/");
      } else {
        throw new Error("トークンの取得に失敗しました");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setApiError(message || "ログインに失敗しました");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-6 text-center text-gray-900">
          ログイン
        </h1>

        {apiError && (
          <div className="bg-red-50 text-red-500 p-3 rounded mb-4 text-sm">
            {apiError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              メールアドレス
            </label>
            <input
              type="email"
              {...register("email", { required: "メールアドレスは必須です" })}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900"
            />
            {errors.email && (
              <p className="text-red-500 text-xs mt-1">
                {errors.email.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              パスワード
            </label>
            <input
              type="password"
              {...register("password", { required: "パスワードは必須です" })}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900"
            />
            {errors.password && (
              <p className="text-red-500 text-xs mt-1">
                {errors.password.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {isSubmitting ? "ログイン中..." : "ログインする"}
          </button>
        </form>

        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600">
            アカウントをお持ちでないですか？{" "}
            <Link href="/signup" className="text-blue-600 hover:underline">
              新規登録はこちら
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
