"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    setError("");

    try {
      const supabase = createClient();
      if (mode === "signup") {
        const { data, error: authError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });
        if (authError) throw authError;

        if (data.session) {
          router.push("/");
          router.refresh();
        } else {
          setMessage("Đã tạo yêu cầu đăng ký. Hãy kiểm tra email để xác nhận tài khoản trước khi đăng nhập.");
        }
      } else {
        const { error: authError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (authError) throw authError;
        router.push("/");
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Có lỗi xảy ra. Vui lòng thử lại.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-5">
      <section className="card w-full" style={{ maxWidth: 440 }}>
        <Link href="/" className="brand" style={{ padding: 0 }}>
          <span className="brand-mark">🐻</span><span>BEAR<em>GOLD</em></span>
        </Link>
        <div className="eyebrow" style={{ marginTop: 32 }}>MEMBER ACCESS</div>
        <h1 style={{ fontSize: 28 }}>{mode === "login" ? "Đăng nhập BearGold" : "Tạo tài khoản BearGold"}</h1>
        <p className="sub">Sử dụng email và mật khẩu của tài khoản BearGold.</p>

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 14, marginTop: 24 }}>
          <label style={{ display: "grid", gap: 7, fontSize: 13 }}>
            Email
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="ban@example.com"
              style={{ width: "100%", padding: 13, borderRadius: 10, border: "1px solid var(--line)", background: "#0b0f16", color: "inherit" }}
            />
          </label>
          <label style={{ display: "grid", gap: 7, fontSize: 13 }}>
            Mật khẩu
            <input
              type="password"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              required
              minLength={8}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Ít nhất 8 ký tự"
              style={{ width: "100%", padding: 13, borderRadius: 10, border: "1px solid var(--line)", background: "#0b0f16", color: "inherit" }}
            />
          </label>

          {error && <p role="alert" style={{ color: "#f87171", fontSize: 13 }}>{error}</p>}
          {message && <p role="status" style={{ color: "#86efac", fontSize: 13 }}>{message}</p>}

          <button type="submit" disabled={busy} className="pill" style={{ width: "100%", justifyContent: "center", opacity: busy ? 0.6 : 1 }}>
            {busy ? "Đang xử lý..." : mode === "login" ? "Đăng nhập" : "Đăng ký"}
          </button>
        </form>

        <button
          type="button"
          onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); setMessage(""); }}
          className="pill"
          style={{ width: "100%", justifyContent: "center", marginTop: 12 }}
        >
          {mode === "login" ? "Chưa có tài khoản? Đăng ký" : "Đã có tài khoản? Đăng nhập"}
        </button>
        <Link href="/" className="pill" style={{ marginTop: 12 }}>← Quay lại tổng quan</Link>
      </section>
    </main>
  );
}
