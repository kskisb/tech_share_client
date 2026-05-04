"use client";

import Link from "next/link";

type NavbarUser =
  | {
      name: string;
    }
  | null
  | undefined;

type AppNavbarProps = {
  user: NavbarUser;
  isLoadingAuth?: boolean;
  onLogout?: () => void;
};

export default function AppNavbar({
  user,
  isLoadingAuth = false,
  onLogout,
}: AppNavbarProps) {
  return (
    <header className="bg-white/90 backdrop-blur border-b border-slate-200 shadow-sm">
      <div className="max-w-5xl mx-auto px-4 py-4 flex justify-between items-center min-h-[72px]">
        <Link
          href="/"
          className="text-xl font-bold text-slate-900 hover:text-blue-700"
        >
          Tech Share
        </Link>
        <div>
          {isLoadingAuth ? (
            <div
              className="flex items-center gap-3"
              aria-label="認証状態を確認中"
            >
              <div className="h-4 w-24 rounded-full bg-slate-200 animate-pulse" />
              <div className="h-9 w-24 rounded-lg bg-slate-200 animate-pulse" />
              <div className="h-4 w-16 rounded-full bg-slate-200 animate-pulse" />
            </div>
          ) : user ? (
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">{user.name}さん</span>
              <Link
                href="/posts/new"
                className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"
              >
                投稿する
              </Link>
              <button
                onClick={onLogout}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                ログアウト
              </button>
            </div>
          ) : (
            <div className="flex gap-3">
              <Link
                href="/login"
                className="text-blue-600 px-4 py-2 rounded text-sm border border-blue-600 hover:bg-blue-50"
              >
                ログイン
              </Link>
              <Link
                href="/signup"
                className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"
              >
                新規登録
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
