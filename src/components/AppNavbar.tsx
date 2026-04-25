"use client";

import Link from "next/link";

type NavbarUser = {
  name: string;
} | null | undefined;

type AppNavbarProps = {
  user: NavbarUser;
  onLogout?: () => void;
};

export default function AppNavbar({ user, onLogout }: AppNavbarProps) {
  return (
    <header className="bg-white shadow">
      <div className="max-w-5xl mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/" className="text-xl font-bold text-blue-600 hover:text-blue-700">
          Tech Share
        </Link>
        <div>
          {user ? (
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">{user.name}さん</span>
              <Link href="/posts/new" className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700">
                投稿する
              </Link>
              <button onClick={onLogout} className="text-sm text-gray-500 hover:text-gray-700">
                ログアウト
              </button>
            </div>
          ) : (
            <div className="flex gap-3">
              <Link href="/login" className="text-blue-600 px-4 py-2 rounded text-sm border border-blue-600 hover:bg-blue-50">
                ログイン
              </Link>
              <Link href="/signup" className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700">
                新規登録
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
