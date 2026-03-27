"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        setError(j.error ?? "Đăng ký thất bại.");
        return;
      }

      await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      router.push("/app");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border bg-white p-6 shadow-sm">
        <div className="mb-6">
          <h1 className="text-xl font-semibold tracking-tight">Đăng ký</h1>
          <p className="text-sm text-zinc-500">
            Tạo tài khoản để lưu dữ liệu nhập và xuất báo cáo.
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <label className="block">
            <div className="text-sm font-medium">Email</div>
            <input
              className="mt-1 w-full rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-zinc-900/10"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </label>

          <label className="block">
            <div className="text-sm font-medium">Mật khẩu</div>
            <input
              className="mt-1 w-full rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-zinc-900/10"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
            />
            <div className="mt-1 text-xs text-zinc-500">
              Tối thiểu 8 ký tự.
            </div>
          </label>

          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl bg-zinc-900 px-4 py-2.5 text-white hover:bg-zinc-800 disabled:opacity-60"
          >
            {busy ? "Đang tạo..." : "Tạo tài khoản"}
          </button>
        </form>

        <div className="mt-4 text-sm text-zinc-600">
          Đã có tài khoản?{" "}
          <a className="font-medium text-zinc-900 underline" href="/login">
            Đăng nhập
          </a>
        </div>
      </div>
    </div>
  );
}

