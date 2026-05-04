"use client";

import { useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { fetchApi } from "@/lib/api";
import { onAuthTokenChanged, syncAuthToken } from "@/lib/api-client";
import AppNavbar from "@/components/AppNavbar";

type NavbarUser = {
  name: string;
};

type MeResponse = {
  data?: {
    user?: NavbarUser;
  };
};

const authFetcher = (url: string) => fetchApi(url) as Promise<MeResponse>;

export default function GlobalNavbar() {
  const router = useRouter();
  const authToken = useSyncExternalStore(
    (onStoreChange) => onAuthTokenChanged(() => onStoreChange()),
    () =>
      typeof window === "undefined" ? undefined : localStorage.getItem("token"),
    () => undefined,
  );

  const { data, mutate, isLoading } = useSWR(
    typeof authToken === "string" ? "/auth/me" : null,
    authFetcher,
    {
      onError: () => {
        syncAuthToken(null);
      },
    },
  );

  const user = data?.data?.user;
  const isLoadingAuth =
    authToken === undefined ||
    (typeof authToken === "string" && (isLoading || !user));

  const handleLogout = () => {
    syncAuthToken(null);
    mutate(undefined, { revalidate: false });
    router.push("/login");
  };

  return (
    <AppNavbar
      user={user}
      isLoadingAuth={isLoadingAuth}
      onLogout={handleLogout}
    />
  );
}
