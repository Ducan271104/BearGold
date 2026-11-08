import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) redirect("/login");

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("email, display_name, role, credits, created_at, updated_at")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    return <main className="admin-page"><h1>Hồ sơ của tôi</h1><p className="admin-notice">Không tải được hồ sơ: {profileError.message}</p><Link className="pill" href="/">← Quay lại</Link></main>;
  }

  return (
    <main className="admin-page">
      <header className="topbar">
        <div><div className="eyebrow">BEARGOLD · MEMBER PROFILE</div><h1>Hồ sơ của tôi</h1><p className="sub">Thông tin tài khoản đang đăng nhập.</p></div>
        <Link href="/" className="pill">← Tổng quan</Link>
      </header>
      <section className="admin-summary">
        <div><span className="pill">TÀI KHOẢN {profile?.role?.toUpperCase() || "CTV"}</span><h2>{profile?.display_name || profile?.email || user.email}</h2><p>Thông tin được đọc từ hồ sơ Supabase của chính tài khoản này.</p></div>
        <div className="bear" aria-hidden="true">🐻</div>
      </section>
      <section className="admin-stats">
        <article className="card"><div className="metric-label">Vai trò</div><div className="metric">{profile?.role?.toUpperCase() || "CTV"}</div></article>
        <article className="card"><div className="metric-label">Credits</div><div className="metric">{profile?.credits ?? 0}</div></article>
      </section>
      <section className="admin-section">
        <div className="section-head"><h2>Thông tin tài khoản</h2><span>Chỉ bạn và Admin được phép xem theo chính sách hiện tại</span></div>
        <div className="table-wrap">
          <table><tbody>
            <tr><th>Email</th><td>{profile?.email || user.email || "—"}</td></tr>
            <tr><th>Tên hiển thị</th><td>{profile?.display_name || "Chưa thiết lập"}</td></tr>
            <tr><th>Mã tài khoản</th><td>{user.id}</td></tr>
            <tr><th>Ngày tạo</th><td>{profile?.created_at ? new Date(profile.created_at).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" }) : "—"}</td></tr>
          </tbody></table>
        </div>
      </section>
      <p className="footer">BEARGOLD © 2026 · PRIVATE MEMBER PROFILE</p>
    </main>
  );
}
