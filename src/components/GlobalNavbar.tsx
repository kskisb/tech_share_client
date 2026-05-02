"use client";

import { useRouter } from "next/navigation";
import useSWR from "swr";
import { fetchApi } from "@/lib/api";
import { setAuthToken } from "@/lib/api-client";
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

  const { data, mutate } = useSWR(
    () =>
      typeof window !== "undefined" && localStorage.getItem("token")
        ? "/auth/me"
        : null,
    authFetcher,
    {
      onError: () => {
        localStorage.removeItem("token");
        setAuthToken(null);
      },
    },
  );

  const user = data?.data?.user;

  const handleLogout = () => {
    localStorage.removeItem("token");
    setAuthToken(null);
    mutate(undefined, { revalidate: false });
    router.push("/login");
  };

  return <AppNavbar user={user} onLogout={handleLogout} />;
}
