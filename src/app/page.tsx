"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { fetchApi } from "@/lib/api";

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string, email: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const data = await fetchApi("/auth/me");
        setUser(data.data.user);
      } catch (err) {
        localStorage.removeItem("token");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">読み込み中...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow">
        {user ? (
          <div className="space-y-4">
            <h1 className="text-2xl font-bold text-gray-900">ようこそ、{user.name}さん！</h1>
            <p className="text-gray-600">メールアドレス: {user.email}</p>
            <button
              onClick={handleLogout}
              className="w-full py-2 px-4 bg-red-600 text-white font-medium rounded hover:bg-red-700"
            >
              ログアウト
            </button>
          </div>
        ) : (
          <div className="space-y-4 text-center">
            <h1 className="text-2xl font-bold text-gray-900">Tech Share</h1>
            <p className="text-gray-600 mb-6">記事を投稿して知識を共有しましょう</p>
            <div className="flex flex-col gap-3">
              {/* Next.jsでは画面遷移に <a> ではなく <Link> を使います */}
              <Link
                href="/login"
                className="w-full py-2 px-4 bg-blue-600 text-white font-medium rounded hover:bg-blue-700"
              >
                ログイン
              </Link>
              <Link
                href="/signup"
                className="w-full py-2 px-4 bg-gray-200 text-gray-800 font-medium rounded hover:bg-gray-300"
              >
                新規登録
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}